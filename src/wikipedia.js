// @ts-check
import { IPv4Prefix, WikimediaUserContributionsResult } from "./schemas.js";

/**
 * 
 * @param {string} href 
 * @param {number} backoff 
 * @return {Promise<JSON | false>}
 */
const fetchJson = async (href, backoff=0) => {

  if (backoff) {
    const ms = 10 * Math.pow(2, backoff);
    console.log(` → Backing off ${ms}milliseconds`);
  await new Promise(resolve => setTimeout(resolve, ms))
  }

  const res = await fetch(href);
  
  return res.json().catch((e) => {
    console.error(` → Error fetching: ${href}`);
    console.error(` → ${e.message}`);
    console.error(` → ${res.status}: ${res.statusText}`);
    if (res.status === 429 && backoff < 10) {
      return fetchJson(href, backoff + 1)
    } else {
      return false;
    }
  });
}

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

  console.log(`Fetching contributions for ${prefix.name} (${prefix.prefix})`);
  const json = await fetchJson(url.href);

  if (json === false) return [];

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
