import fs from "fs";
import path from "path";
import pl from "nodejs-polars";

let database_root = path.resolve("database/1/") + "/";
const index_separator = " / ";

interface Meta {
  columns: {
    [key: string]: [string, string, number]; // This indicates that 'columns' is an object with string keys and values of any type.
  };
}

async function get_meta(dataset: string): Promise<Meta> {
  let meta_filename = database_root + dataset + "meta.json";
  let meta = JSON.parse(await fs.promises.readFile(meta_filename));
  return meta;
}

function get_index_columns(meta: Meta): string[] {
var index_columns: Array<[number, string]> = [];
  for (var column_name in meta["columns"]) {
    var v = meta["columns"][column_name];
    if (v[0] == "index") {
      var pos = v[2] ?? 999;
      index_columns.push([pos, column_name]);
    }
  }
  index_columns.sort();
  var out: string[] = index_columns.map((kv) => kv[1]);
  return out;

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
  var index_columns = get_index_columns(meta);
  let df = pl.scanParquet(database_root + dataset + "df.parquet");
  let col = df.select(index_columns);
  let uq = col.unique();
  var q: string|RegExp;
  if (prefix) {
    q = new RegExp("^" + query);
  } else {
    q = query;
  }
  var filter = or_filters(index_columns.map((column) => 
	  pl.col(column).cast(pl.Utf8).str.toLowerCase().str.contains(q)));
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

export async function get_row(row_identifier: string, dataset: string): object[] {
	let meta = await get_meta(dataset);
    var index_columns = get_index_columns(meta);
	var filters = row_identifier.split(index_separator);
	if (index_columns.length == 0) {
		throw new Error("No index columns?");
	}
	if (index_columns.length != filters.length) {
		throw new Error("Invalid row identifier");
	}
	var pl_filter: Array<pl.Expr> = [];
	for (var ii = 0; ii < index_columns.length; ii++) {
		console.log(index_columns[ii], filters[ii]);
		pl_filter.push(
		pl.col(index_columns[ii]).cast(pl.Utf8).eq(pl.lit(filters[ii])));
	}
	var combined_filter = or_filters(pl_filter);
	let df = pl.scanParquet(database_root + dataset + "df.parquet");
	console.log(pl_filter);
	console.log(combined_filter);
	let filtered = df.filter(combined_filter);
	let casted = filtered.select(pl.col(pl.Categorical).cast(pl.Utf8));
	let values = await casted.collect();
	console.log(values);
	let out = [];
	let rows = values.rows();
	for (var row of rows) {
		out.push(row);
	}
	return out;



}
