import { json } from "@sveltejs/kit";
import { get_meta, get_row } from "$lib/data";

export async function GET({ url, params }: LoadInput) {
  var dataset = url.searchParams.get("dataset");
  var database_version = params.database_version;
  if (!dataset.endsWith("/")) {
	dataset = dataset + "/";
  }
  var identifier = url.searchParams.get("identifier");

  var out_df = await get_row(identifier, database_version, dataset);

  var out = {
    data: out_df,
    meta: await get_meta(database_version, dataset),
  };

  return json(out);
}
