// @ts-check
import { IPv4Prefix, WikimediaUserContributionsResult } from "./schemas.js";

/**
 *
 * @param {IPv4Prefix} prefix
 * @returns
 */
export const fetchContributions = async (prefix) => {
  const now = new Date();
  const lastYear = new Date();
  lastYear.setFullYear(now.getFullYear() - 1);
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "usercontribs");
  url.searchParams.set("uclimit", "max");
  url.searchParams.set("ucdir", "older");
  url.searchParams.set("ucstart", now.toISOString());
  url.searchParams.set("ucend", lastYear.toISOString());
  url.searchParams.set("uciprange", prefix.prefix);
  url.searchParams.set("format", "json");

  const res = await fetch(url.href);
  console.log(`Fetching contributions for ${prefix.name} (${prefix.prefix})`);
  const json = await res.json();
  const { data, success, error } =
    WikimediaUserContributionsResult.safeParse(json);
  if (!success) {
    console.error(error, json);
    return [];
  }
  return data.query.usercontribs.map((contribution) => ({
    prefix,
    contribution,
  }));
};
