import { json } from "@sveltejs/kit";
import { get_meta, get_row } from "$lib/data";

export async function GET({ url }: LoadInput) {
  var dataset = url.searchParams.get("dataset");
  if (!dataset.endsWith("/")) {
	dataset = dataset + "/";
  }
  var identifier = url.searchParams.get("identifier");

  var out_df = await get_row(identifier, dataset);

  var out = {
    data: out_df,
    meta: await get_meta(dataset),
  };

  return json(out);
}
