import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  //const url = new URL(event.request.url);

  const user = event.request.headers.get("REMOTE_USER") ??
    process.env.REMOTE_USER;
  if (user == undefined) {
    throw new Error("no auth");
  }
const str_groups = event.request.headers.get("REMOTE_GROUPS") ??
    process.env.REMOTE_GROUPS;
  if (str_groups == undefined) {
    throw new Error("no groups");
  }
  const groups = str_groups.split(",");
  // check if secronet is in groups
  if (!groups.includes("secronet")) {
	throw new Error("not in group");
  }

  event.locals.user = user;

  return resolve(event);
};
