import { LoadInput, LoadOutput } from "@sveltejs/kit";

import { list_datasets} from "$lib/data";

export async function load({ }: LoadInput): LoadOutput {
	let datasets = await list_datasets();
  return {
	  datasets: datasets,
  };
}
