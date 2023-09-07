import { LoadInput, LoadOutput } from "@sveltejs/kit";
import { get_meta } from "$lib/data";


export async function load({ params }: LoadInput): LoadOutput {
	let dataset = params.dataset.replaceAll(":::", "/");
	let meta = get_meta(dataset);

  return {
	  'dataset': dataset,
	  'meta': meta,
  };
}
