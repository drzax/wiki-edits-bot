import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "url";
import {
  ASNPrefixesQueryResult,
  CachedASNPrefixesQueryResult,
} from "./schemas.js";

const cacheExpire = 1000 * 60 * 60 * 24 * 7;

/**
 * Fetch ASN prefix data from the pgpview.io API
 *
 * @param {string} asn
 */
const fetchASNPrefixes = async (asn) => {
  try {
    const res = await fetch(`https://api.bgpview.io/asn/${asn}/prefixes`);
    const data = ASNPrefixesQueryResult.parse(await res.json());
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Get ASN prefix data, but check first if we have reasonably new data already.
 * @param {string} asn
 * @param {number} now
 */
export const getCachedASNPrefixes = async (asn, now = Date.now()) => {
  /** @type CachedASNPrefixesQueryResult */
  let cached;
  const filename = resolve(
    dirname(fileURLToPath(import.meta.url)),
    `../data/asns/${asn}.json`
  );
  try {
    cached = CachedASNPrefixesQueryResult.parse(
      JSON.parse(
        existsSync(filename) ? await readFile(filename, "utf-8") : "{}"
      )
    );
    if (cached.ts < now - cacheExpire) {
      throw new Error("Cached query has expired");
    }
  } catch (e) {
    console.log(`Refreshing cached ASN data for ${asn}`);

    // Either the query has never been cached or it has expired.
    const result = await fetchASNPrefixes(asn);

    if (result !== null) {
      /** @type CachedASNPrefixesQueryResult */
      const data = {
        ts: now,
        result,
      };
      writeFile(filename, JSON.stringify(data, undefined, 2), "utf-8");
    }
    return result;
  }

  return cached.result;
};

/**
 * A generator for ASN prefix data.
 *
 * @param {string[]} asns An array of ASNs to fetch data for.
 * @returns
 */
export async function* fetchPrefixes(asns) {
  for (let i = 0; i < asns.length; i++) {
    const asn = asns[i];
    const data = await getCachedASNPrefixes(asn);
    if (data === null) continue;
    for (let j = 0; j < data.data.ipv4_prefixes.length; j++) {
      yield data.data.ipv4_prefixes[j];
    }
  }
}
