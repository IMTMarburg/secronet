import { json } from "@sveltejs/kit";
import type { LoadInput } from "@sveltejs/kit";
import pl from "nodejs-polars";
import fs from "fs";
import path from "path";

let database_root = path.resolve("database/1/") + "/";

type StringMap = {
  [key: string]: any;
};
let cache: StringMap = {};

async function get_meta(dataset: string) {
  let meta_filename = database_root + dataset + "meta.json";
  let meta = JSON.parse(await fs.promises.readFile(meta_filename));
  return meta;
}

export async function GET({ url }: LoadInput) {
  var dataset = url.searchParams.get("dataset");
  //add / if necessary
  if (dataset[dataset.length - 1] != "/") {
    dataset += "/";
  }
  if (dataset.indexOf("..") != -1) {
    throw new Error("Invalid dataset name");
  }

  //let column = url.searchParams.get("column");
  let query = url.searchParams.get("query").toLowerCase();
  let prefix = url.searchParams.get("prefix", "false") != "false";
  let meta = await get_meta(dataset);

  //read meta from json file into object
  var index_columns = [];
  for (var column_name in meta["columns"]) {
    var v = meta["columns"][column_name];
    if (v[0] == "index") {
      var pos = v[2] ?? 999;
      index_columns.push([pos, column_name]);
    }
  }
  index_columns.sort();
  index_columns = index_columns.map((kv) => kv[1]);

  let key = dataset;
  if (cache[key] == undefined) {
    let df = pl.scanParquet(database_root + dataset + "df.parquet");
    let col = df.select(index_columns);
    let uq = col.unique();
    var q;
    if (prefix) {
      q = new RegExp("^" + query);
    } else {
      q = query;
    }
    var filter = pl.col(index_columns[0]).cast(pl.Utf8).str.toLowerCase().str
      .contains(q);
    for (var ii = 1; ii < index_columns.length; ii++) {
      filter = filter.or(
        pl.col(index_columns[ii]).cast(pl.Utf8).str.toLowerCase().str.contains(
          q,
        ),
      );
    }
    let filtered = uq.filter(
      filter,
    );
    let sorted = filtered.sort(index_columns);
    let casted = sorted.select(pl.col(index_columns).cast(pl.Utf8));
    let values = await casted.collect();
    let out = [];
    let rows = values.rows();
    for (var row of rows) {
      //join with :
      console.log(row);
      out.push(row.join(" / "));
    }
    return json(out);
  }

  let data = pl.readCSV(dataset + "/df.tsv", {
    sep: "\t",
  });

  return json(number);
}
