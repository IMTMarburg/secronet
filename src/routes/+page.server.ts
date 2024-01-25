import { LoadInput, LoadOutput } from "@sveltejs/kit";

import { list_databases } from "$lib/data";

export async function load({}: LoadInput): LoadOutput {
  let databases = await list_databases();
  databases.sort((a, b) => {
    return b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return {
    databases: databases,
  };
}
