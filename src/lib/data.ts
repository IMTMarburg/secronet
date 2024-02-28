import fs from "fs";
import path from "path";
import { pl } from "nodejs-polars";
import process from "process";
import { globSync } from "glob";

let DATABASE_DIR = process.env["DATABASE_DIR"] ?? "database";
let project_root = process.cwd();

let database_root = path.resolve(path.join(project_root, DATABASE_DIR)) +
  "/";
const index_separator = " / ";

export async function list_databases(): Promise<string[]> {
  let maybe_folders = globSync("*", { cwd: database_root });
  let folders: string[] = [];
  for (var folder of maybe_folders) {
    if (fs.lstatSync(database_root + folder).isDirectory()) {
      folders.push(folder);
    }
  }
  return folders;
}

async function check_database_version(database_version: String) {
  let databases = await list_databases();
  if (!databases.includes(database_version)) {
    throw new Error("Invalid database version " + database_version);
  }
}

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
export async function list_datasets(
  database_version: String,
): Promise<Dataset[]> {
  await check_database_version(database_version);
  if (cached_datasets == null) {
	  cached_datasets = {};
  }
  if (cached_datasets[database_version] == undefined) {
    //find every meta.json below database_root. So **/meta.json
    let out: Dataset[] = [];
    var meta_jsons = globSync("**/meta.json", {
      cwd: database_root + database_version,
    });
    for (var idx in meta_jsons) {
      let filename = meta_jsons[idx];
      var info = JSON.parse(
        (await fs.promises.readFile(
          database_root + database_version + "/" + filename,
        )).toString(),
      );
      out.push({
        name: filename.replace("/meta.json", ""),
        description: info["description"],
      });
    }
    cached_datasets[database_version] = out;
  }
  return cached_datasets[database_version];
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

export async function get_meta(
  database_version: String,
  dataset: string,
): Promise<Meta> {
  dataset = normalize_dataset(dataset);
  let meta_filename = database_root + database_version + "/" + dataset +
    "meta.json";
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
  database_version: string,
  dataset: string,
  prefix: boolean,
): Promise<string[]> {
  let meta = await get_meta(database_version, dataset);
  var index_columns = meta.index_columns;

  if (dataset[dataset.length - 1] != "/") {
    dataset += "/";
  }

  let df = pl.scanParquet(
    database_root + database_version + "/" + dataset + "df.parquet",
  );
  let col = df.select(index_columns);
  let uq = col.unique();
  var qs: (string | RegExp)[] = new Array();
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
  database_version: string,
  dataset: string,
): Promise<pl.DataFrame> {
  let meta = await get_meta(database_version, dataset);
  if (!dataset.endsWith("/")) {
    dataset = dataset + "/";
  }

  var index_columns = meta.index_columns;
  var filters = row_identifier.split(index_separator);
  if (index_columns.length == 0) {
    throw new Error("No index columns?");
  }
  if (index_columns.length != filters.length) {
    throw new Error(
      "Invalid row identifier " + dataset + " " +
        JSON.stringify(index_columns) + JSON.stringify(filters),
    );
  }
  var pl_filter: Array<pl.Expr> = [];
  for (var ii = 0; ii < index_columns.length; ii++) {
    pl_filter.push(
      pl.col(index_columns[ii]).cast(pl.Utf8).eq(pl.lit(filters[ii])),
    );
  }
  var combined_filter = or_filters(pl_filter);
  let df = pl.scanParquet(
    database_root + database_version + "/" + dataset + "df.parquet",
  );
  let filtered = df.filter(combined_filter);
  //let casted = filtered.select(pl.col(pl.Categorical).cast(pl.Utf8));
  //let values = await casted.collect();
  let values = await filtered.collect();
  return values;
}

interface TVD {
  tag: String;
  value: String;
  dataset: String;
}

export async function get_meta_tags(database_version): Promise<TVD[]> {
  //for all datasets,
  //go through their meta tags, and
  //return a list of {tag, value, dataset}
  let result: TVD[] = [];
  let datasets = await list_datasets(database_version);
  //console.log(datasets);
  for (var dataset of datasets) {
    let meta = await get_meta(database_version, dataset.name);
    for (var tag of Object.keys(meta.tags)) {
      let value = meta.tags[tag];
      result.push({ tag: tag, value: value, dataset: dataset.name });
    }
  }

  return result;
}
