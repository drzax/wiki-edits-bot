import { z } from "zod";

export const IPv4Prefix = z.object({
  prefix: z.string(),
  ip: z.string(),
  cidr: z.number(),
  roa_status: z.string(),
  name: z.string(),
  description: z.string(),
  country_code: z.string(),
  parent: z.object({
    prefix: z.string(),
    ip: z.string(),
    cidr: z.number(),
    rir_name: z.string(),
  }),
});
export type IPv4Prefix = z.infer<typeof IPv4Prefix>;

export const WikimediaUserContribution = z.object({
  userid: z.number(),
  user: z.string(),
  pageid: z.number(),
  revid: z.number(),
  parentid: z.number(),
  ns: z.number(),
  title: z.string(),
  timestamp: z.string(),
  comment: z.string(),
  size: z.number(),
});
export type WikimediaUserContribution = z.infer<
  typeof WikimediaUserContribution
>;

export const WikimediaUserContributionsResult = z.object({
  query: z.object({
    usercontribs: z.array(WikimediaUserContribution),
  }),
});
export type WikimediaUserContributionsResult = z.infer<
  typeof WikimediaUserContributionsResult
>;

export const ASNPrefixesQueryResult = z.object({
  data: z.object({
    ipv4_prefixes: z.array(IPv4Prefix),
  }),
});
export type ASNPrefixesQueryResult = z.infer<typeof ASNPrefixesQueryResult>;

export const CachedASNPrefixesQueryResult = z.object({
  ts: z.number(),
  result: ASNPrefixesQueryResult,
});
export type CachedASNPrefixesQueryResult = z.infer<
  typeof CachedASNPrefixesQueryResult
>;
