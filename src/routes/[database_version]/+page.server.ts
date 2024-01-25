import { LoadInput, LoadOutput } from "@sveltejs/kit";

import { get_meta_tags, list_datasets } from "$lib/data";
import { natsort } from "natsort";

export async function load({ params }: LoadInput): LoadOutput {
  let datasets = await list_datasets(params.database_version);
  datasets.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  let meta_tags = await get_meta_tags(params.database_version);
  return {
    datasets: datasets,
    meta_tags: meta_tags,
    database_version: params.database_version,
  };
}
