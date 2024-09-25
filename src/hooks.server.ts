import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  //const url = new URL(event.request.url);

  const user = event.request.headers.get("REMOTE_USER") ??
    process.env.REMOTE_USER;
  if (user == undefined) {
    throw new Error("no auth"); // this should not happen if the nginx is working
  }
  const str_groups = event.request.headers.get("REMOTE_GROUPS") ??
    process.env.REMOTE_GROUPS;
  if (str_groups == undefined) {
    throw new Error("no groups");
  }
  /* const groups = str_groups.split("\t");
  // check if secronet is in groups
  if (!groups.includes("secronet")) {
    //I need to redirect to /auth?missing=secronet
    console.log("redirecting to /auth?missing=secronet");
	console.log("Groups was" + JSON.stringify(groups));
    return new Response(null, {
      status: 302,
      headers: { location: "/auth/?missing=secronet" },
    });
  } */

  event.locals.user = user;

  return resolve(event);
};
