import { json } from "@sveltejs/kit";
import pl from "nodejs-polars";

let cache = {};

export async function GET({ url }) {
  let dataset = url.searchParams.get("dataset");
  let column = url.searchParams.get("column");
  let query = url.searchParams.get("query").toLowerCase();
  let prefix = url.searchParams.get("prefix", "false") != "false";

  let key = dataset + ":" + column;
  if (cache[key] == undefined) {
    let df = pl.scanParquet("database/1/" + dataset + "df.parquet");
    let col = df.select(column);
    let uq = col.unique();
    var q;
    if (prefix) {
      q = new RegExp("^" + query);
    } else {
      q = query;
    }
    let filtered = uq.filter(
      pl.col(column).cast(pl.Utf8).str.toLowerCase().str.contains(q),
    );
    let sorted = filtered.sort(column);
    let values = await sorted.collect();
    return json(values[column]);
  }

  let data = pl.readCSV("database/1/secretome/olink/TCell_Anna_Steitz/df.tsv", {
    sep: "\t",
  });

  return json(number);
}
