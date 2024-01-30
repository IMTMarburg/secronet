import { json } from "@sveltejs/kit";
import type { LoadInput } from "@sveltejs/kit";

import { search_identifiers } from "$lib/data";

type StringMap = {
  [key: string]: any;
};
let cache: StringMap = {};

export async function GET({ url, params }: LoadInput) {
  var dataset = url.searchParams.get("dataset");
  //add / if necessary
  if (dataset.indexOf("..") != -1) {
    throw new Error("Invalid dataset name");
  }

  //let column = url.searchParams.get("column");
  let query = url.searchParams.get("query").toLowerCase();
  let prefix = url.searchParams.get("prefix", "false") != "false";

  let out = await search_identifiers(query, params.database_version, dataset, prefix);
  if (out.length > 100) {
	  out = out.slice(0, 100);
  }
  return json(out);
}
