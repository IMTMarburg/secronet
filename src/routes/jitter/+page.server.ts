import { LoadInput, LoadOutput } from "@sveltejs/kit";
import { get_meta, get_row } from "$lib/data";

  import pl from 'nodejs-polars';

export async function load({ locals, url }: LoadInput): LoadOutput {
	let dataset = url.searchParams.get("dataset");
	let meta = get_meta(dataset);

  return {
	  'dataset': dataset,
	  'meta': meta,
  };
}
