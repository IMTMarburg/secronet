import { json } from "@sveltejs/kit";
import { get_row } from "$lib/data";

export async function GET({ url }: LoadInput) {
  var dataset = url.searchParams.get("dataset");
  console.log("dataset", dataset);
  var identifier = url.searchParams.get("identifier");

  return json(await get_row(identifier, dataset));
}
