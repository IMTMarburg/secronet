import { LoadInput, LoadOutput } from "@sveltejs/kit";
import { get_meta } from "$lib/data";


export async function load({ params }: LoadInput): LoadOutput {
	let dataset = params.dataset.replaceAll(":::", "/");
	let meta = await get_meta(params.database_version, dataset);

  return {
	  'dataset': dataset,
	  'database_version': params.database_version,
	  'meta': meta,
  };
}
