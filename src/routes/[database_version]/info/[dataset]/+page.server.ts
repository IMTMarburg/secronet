import { LoadInput, LoadOutput } from "@sveltejs/kit";
import {get_meta} from '$lib/data';

  import pl from 'nodejs-polars';

export async function load({ params }: LoadInput): LoadOutput {
	let dataset = params.dataset.replaceAll(":::", "/");

  return {
	  meta: get_meta(params.database_version, dataset),
	  dataset: dataset,
	  databse_version: params.database_version,
  };
}
