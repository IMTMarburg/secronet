import { LoadInput, LoadOutput } from "@sveltejs/kit";

export async function load({ params }: LoadInput): LoadOutput {
  return {
    database_version: params.database_version,
  };
}


