import { IPv4Prefix, WikimediaUserContributionsResult } from "./schemas";

export const fetchContributions = async (prefix: IPv4Prefix) => {
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
