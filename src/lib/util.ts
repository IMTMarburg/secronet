import process from "process";
import fs from "fs";
const { subtle } = globalThis.crypto;
import { add_styles } from "svelte/internal";
import toml from "toml";
import * as EmailValidator from "email-validator";

export function iso_date(date: Date) {
  const isoDate = date.toISOString().split("T")[0];
  return isoDate;
}

export function isodate_to_timestamp(iso: string) {
  if (iso == null) {
    return null;
  }
  //parse iso date YYYY-mm-dd into timestamp
  let re = /(\d+)-(\d+)-(\d+)/;
  let match = re.exec(iso);
  if (match) {
    let year = parseInt(match[1]);
    let month = parseInt(match[2]);
    let day = parseInt(match[3]);
    let date = new Date(year, month - 1, day);
    return date.getTime() / 1000;
  } else {
    throw new Error("Invalid date format");
  }
}

export function iso_date_and_time(input_date: Date) {
  let date = new Date(input_date);
  const isoTime = date.toISOString().split("T")[1].split(".")[0];
  const hours = isoTime.substr(0, 2);
  const minutes = isoTime.substr(3, 2);
  const isoDate = date.toISOString().split("T")[0];
  return `${isoDate} ${hours}:${minutes}`;
}

export function format_timestamp(unix_timestamp: number) {
  const date = new Date(unix_timestamp * 1000);
  try {
    return toIsoStringTZO(date, true);
  } catch (e) {
    return unix_timestamp;
  }
}

export function human_since(days: number) {
  //< 365 days => x days
  //afterwards y years and x days
  let suffix = "";
  if (days < 0) {
    suffix = "in the future";
    days = days * -1;
  } else {
    suffix = "ago";
  }
  if (days < 365) {
    return `${days} days ${suffix}`;
  } else {
    const years = Math.floor(days / 365);
    const rmdays = days % 365;
    return `${years} years and ${rmdays} days ${suffix}`;
  }
}

export function format_date_and_period(unix_timestamp: number) {
  const date = new Date(unix_timestamp * 1000);
  const isoDate = date.toISOString().split("T")[0];
  const days_since = Math.floor((Date.now() - date.getTime()) / 86400000);
  return `${isoDate} (${human_since(days_since)})`;
}

export function event_details(event: object) {
  switch (event.type) {
    /* case "run_discovered":
      return `<b>${event.name}</b><br />Run finish date: ${
        format_timestamp(event.run_finish_date)
      }`;
      break; */
    case undefined:
    default:
      let out = structuredClone(event);
      for (let key in out) {
        if (key.endsWith("_date") || key.endsWith("timestamp")) {
          out[key + "_human"] = format_timestamp(out[key]);
          delete out[key];
        }
      }
      delete out.type;
      delete out.pid;
      return out;
      break;
  }
}

export async function hash_string(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return hash;
}

export function toIsoStringTZO(date, include_time) {
  var tzo = -date.getTimezoneOffset();
  let pad = function (num) {
    return (num < 10 ? "0" : "") + num;
  };

  if (include_time) {
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  } else {
  }

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate())
  );
}

export function plus_days(date: Date, days: number) {
  const new_date = new Date(date);
  new_date.setDate(new_date.getDate() + days);
  return new_date;
}

export function plus_months(date: Date, months: number) {
  const new_date = new Date(date);
  new_date.setMonth(new_date.getMonth() + months);
  return new_date;
}

export function plus_years(date: Date, years: number) {
  const new_date = new Date(date);
  new_date.setFullYear(new_date.getFullYear() + years);
  return new_date;
}

export function date_min(dateA: Date, dateB: Date) {
  if (dateA == null) {
    return dateB;
  }
  if (dateB == null) {
    return dateA;
  }
  if (dateA < dateB) {
    return dateA;
  } else {
    return dateB;
  }
}

export function contains_all_words(haystack: string, needle: string) {
  let haystack2 = haystack.toLowerCase();
  let needle2 = needle.toLowerCase();
  let words = needle2.split(" ");
  for (let word of words) {
    if (haystack2.indexOf(word) == -1) {
      return false;
    }
  }
  return true;
}
