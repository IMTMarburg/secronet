import { LoadInput, LoadOutput } from "@sveltejs/kit";

import { get_meta_tags, list_datasets } from "$lib/data";
import { natsort } from "natsort";

export async function load({}: LoadInput): LoadOutput {
  let datasets = await list_datasets();
  datasets.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  let meta_tags = await get_meta_tags();
  return {
    datasets: datasets,
    meta_tags: meta_tags,
  };
}
