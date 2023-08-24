import { json } from "@sveltejs/kit";
import { get_meta, get_row } from "$lib/data";
import pl from "nodejs-polars";

export async function GET({ url }: LoadInput) {
	console.log("GET");
  var dataset = url.searchParams.get("dataset");
  if (!dataset.endsWith("/")) {
	dataset = dataset + "/";
  }
  console.log("dataset", dataset);
  var identifier = url.searchParams.get("identifier");
  console.log("identifier", identifier);

  var out_df = await get_row(identifier, dataset);
  console.log("out_df", out_df);

  var out = {
    data: out_df,
    meta: await get_meta(dataset),
  };

  return json(out);
}
