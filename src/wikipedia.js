import { IPv4Prefix, WikimediaUserContributionsResult } from "./schemas.js";

/**
 *
 * @param {IPv4Prefix} prefix
 * @returns
 */
export const fetchContributions = async (prefix) => {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=usercontribs&uclimit=max&ucdir=older&uciprange=${prefix.prefix}&format=json`
  );
  console.log(`Fetching contributions for ${prefix.name} (${prefix.prefix})`);
  const data = WikimediaUserContributionsResult.parse(await res.json());
  return data.query.usercontribs.map((contribution) => ({
    prefix,
    contribution,
  }));
};
