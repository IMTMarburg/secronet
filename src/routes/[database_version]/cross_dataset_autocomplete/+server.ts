import { json } from "@sveltejs/kit";
import type { LoadInput } from "@sveltejs/kit";

import { search_identifiers, list_datasets } from "$lib/data";

type StringMap = {
  [key: string]: any;
};
let cache: StringMap = {};

export async function GET({ url, params }: LoadInput) {

  //let column = url.searchParams.get("column");
  let query = url.searchParams.get("query").toLowerCase();
  let prefix = url.searchParams.get("prefix", "false") != "false";

  let datasets = await list_datasets(params.database_version);
  let total_out: string[] = [];
  for (let dataset of datasets) {
	let out = await search_identifiers(query, params.database_version, dataset.name, prefix);
	if (out.length > 10) {
		out = out.slice(0, 10);
	}
	//only add if they'r not already in the list
	for (let item of out) {
		if (total_out.indexOf(item) == -1) {
			total_out.push(item);
		}
	}
	if (total_out.length > 100) {
		break;
	}
  }
  return json(total_out);
}

