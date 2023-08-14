import { LoadInput, LoadOutput } from "@sveltejs/kit";

export async function load({ locals }: LoadInput): LoadOutput {
  return {
    user: locals.user,
  };
}
