import { LoadInput, LoadOutput } from "@sveltejs/kit";
import { list_datasets } from "$lib/data";


export async function load({ params }: LoadInput): LoadOutput {

  return {
	  'datasets': await list_datasets(params.database_version),
	  'database_version': params.database_version,
  };
}
