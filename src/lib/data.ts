import fs from "fs";
import path from "path";
import pl from "nodejs-polars";
import { globSync } from "glob";
import process from "process";

let DATABASE_DIR = process.env["DATABASE_DIR"];

let database_root = path.resolve(DATABASE_DIR) + "/1/";
const index_separator = " / ";

interface Column {
  kind: String;
  description: String;
  order: Number | undefined;
}

interface Meta {
  columns: {
    [key: string]: Column;
  };
  value_columns: string[];
  condition_columns: string[];
  index_columns: string[];
}

interface Dataset {
  name: string;
  description: string;
}

var cached_datasets: Dataset[] | null = null;
export async function list_datasets(): Promise<Dataset[]> {
  if (cached_datasets == null) {
    //find every meta.json below database_root. So **/meta.json
    let out: Dataset[] = [];
    var meta_jsons = globSync("**/meta.json", { cwd: database_root });
    for (var idx in meta_jsons) {
      let filename = meta_jsons[idx];
      var info = JSON.parse(
        (await fs.promises.readFile(database_root + filename)).toString(),
      );
      out.push({
        name: filename.replace("/meta.json", ""),
        description: info["description"],
      });
    }
    cached_datasets = out;
  }
  return cached_datasets;
}

function normalize_dataset(dataset: string): string {
  if (!dataset.endsWith("/")) {
    dataset = dataset + "/";
  }
  if (dataset.includes("/..")) {
    throw new Error("Invalid dataset name");
  }
  return dataset;
}

export async function get_meta(dataset: string): Promise<Meta> {
  dataset = normalize_dataset(dataset);
  let meta_filename = database_root + dataset + "meta.json";
  let meta: Meta = JSON.parse(
    (await fs.promises.readFile(meta_filename)).toString(),
  );
  meta.value_columns = Object.entries(meta["columns"])
    .filter(([_, value]) => value["kind"] == "value")
    //sort by order
    .sort(([_, a], [__, b]) =>
      Number(a["order"] ?? 0) - Number(b["order"] ?? 0)
    )
    .map(([key, _]) => key);

  meta.condition_columns = Object.entries(meta["columns"])
    .filter(([_, value]) => value["kind"] == "condition")
    .sort(([_, a], [__, b]) =>
      Number(a["order"] ?? 0) - Number(b["order"] ?? 0)
    )
    .map(([key, _]) => key);

  meta.index_columns = Object.entries(meta["columns"])
    .filter(([_, value]) => value["kind"] == "index")
    .sort(([_, a], [__, b]) =>
      Number(a["order"] ?? 0) - Number(b["order"] ?? 0)
    )
    .map(([key, _]) => key);

  return meta;
}

function or_filters(pl_filters: pl.Expr[]) {
  var res = pl_filters[0];
  for (var ii = 1; ii < pl_filters.length; ii++) {
    res = res.or(pl_filters[ii]);
  }
  return res;
}

export async function search_identifiers(
  query: string,
  dataset: string,
  prefix: boolean,
): Promise<string[]> {
  let meta = await get_meta(dataset);
  var index_columns = meta.index_columns;
  let df = pl.scanParquet(database_root + dataset + "df.parquet");
  let col = df.select(index_columns);
  let uq = col.unique();
  var qs: (string | RegExp)[] = new Array();
  console.log("query", query);
  let split_queries = query.split(" ");
  for (var idx in split_queries) {
    var qt = split_queries[idx].trim();
    if (qt.length > 0) {
      if (prefix) {
        qs.push(new RegExp("^" + qt));
      } else {
        qs.push(qt);
      }
    }
  }
  var filters: pl.Expr[] = [];
  for (var q of qs) {
    for (var column of index_columns) {
      filters.push(
        pl.col(column).cast(pl.Utf8).str.toLowerCase().str.contains(q),
      );
    }
  }
  var filter = or_filters(filters);
  let filtered = uq.filter(
    filter,
  );
  let sorted = filtered.sort(index_columns);
  let casted = sorted.select(pl.col(index_columns).cast(pl.Utf8));
  let values = await casted.collect();
  let out = [];
  let rows = values.rows();
  for (var row of rows) {
    out.push(row.join(index_separator));
  }
  return out;
}

export async function get_row(
  row_identifier: string,
  dataset: string,
): Promise<pl.DataFrame> {
  let meta = await get_meta(dataset);
  var index_columns = meta.index_columns;
  var filters = row_identifier.split(index_separator);
  if (index_columns.length == 0) {
    throw new Error("No index columns?");
  }
  if (index_columns.length != filters.length) {
    throw new Error("Invalid row identifier");
  }
  var pl_filter: Array<pl.Expr> = [];
  for (var ii = 0; ii < index_columns.length; ii++) {
    pl_filter.push(
      pl.col(index_columns[ii]).cast(pl.Utf8).eq(pl.lit(filters[ii])),
    );
  }
  var combined_filter = or_filters(pl_filter);
  let df = pl.scanParquet(database_root + dataset + "df.parquet");
  let filtered = df.filter(combined_filter);
  //let casted = filtered.select(pl.col(pl.Categorical).cast(pl.Utf8));
  //let values = await casted.collect();
  let values = await filtered.collect();
  return values;
}
