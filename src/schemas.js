import { z } from "zod";

export const State = z.object({
  lastRun: z.number().optional(),
});

/** @typedef { z.infer<typeof State> } State */

export const IPv4Prefix = z.object({
  prefix: z.string(),
  ip: z.string(),
  cidr: z.number(),
  roa_status: z.string(),
  name: z.string(),
  description: z.string(),
  country_code: z.string(),
});

/** @typedef { z.infer<typeof IPv4Prefix> } IPv4Prefix */

export const WikimediaUserContribution = z.object({
  userid: z.number(),
  user: z.string(),
  pageid: z.number(),
  revid: z.number(),
  parentid: z.number(),
  ns: z.number(),
  title: z.string(),
  timestamp: z.string(),
  comment: z.string().optional(),
  commenthidden: z.string().optional(),
  texthidden: z.string().optional(),
  size: z.number(),
});
/** @typedef { z.infer<typeof WikimediaUserContribution> } WikimediaUserContribution */

export const WikimediaUserContributionsResult = z.object({
  query: z.object({
    usercontribs: z.array(WikimediaUserContribution),
  }),
});
/** @typedef { z.infer<typeof WikimediaUserContributionsResult> } WikimediaUserContributionsResult */

export const ASNPrefixesQueryResult = z.object({
  data: z.object({
    ipv4_prefixes: z.array(IPv4Prefix),
  }),
});
/** @typedef { z.infer<typeof ASNPrefixesQueryResult> } ASNPrefixesQueryResult */

export const CachedASNPrefixesQueryResult = z.object({
  ts: z.number(),
  result: ASNPrefixesQueryResult,
});
/** @typedef { z.infer<typeof CachedASNPrefixesQueryResult> } CachedASNPrefixesQueryResult */
