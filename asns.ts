import { getCached, setCached } from "./db";
import {
  ASNPrefixesQueryResult,
  CachedASNPrefixesQueryResult,
} from "./schemas";

export const federal = [
  "134111", // CSIRO
  "9342", // ABC
  "9509", // Department of Education, Skills and Employment
  "17756", // Australia Post
  "141468", // DPMC
  "38470", // DIBP
  "38474", // Department of Agriculture, Water and the Environment
  "23667", // Bureau of Meteorology
  "18055", // Department of Human Services
  "45442", // Department of Parliamentary Services
  "137525", // NBN Co Ltd
  "138681", // ASIC
  "141400", // Comcare
  "132469", // Department of Primary Industries and Regional Development
  "7550", // SBS
  "17434", // Reserve Bank of Australia
  "136013", // National Gallery of Australia
  "137024", // Australian Crime Commission
];

export const other = [
  "132321", // NT government
  "139344", // ACT government
  "132909", // ACT government
  "136518", // WA government
  "150301", // WA Water Corporation,
  "24313", // NSW Department of Education
  "9348", // Victorian Cultural Network
  "59383", // NSW Office of Finance and Services
  "134096", // eHealth NSW
  "7637", // State Library of Victoria
  "55542", // Roads and Maritime Services NSW
  "17654", // Western Power Corporation
  "131462", // Western Australian Land Information Authority
  "17461", // NSW Department of Commerce
  "58681", // NSW Police
  "133081", // State Revenue Office Victoria
  "63983", // Queensland Health
  "4822", // National Library of Victoria
  "135880", // Department of Culture and the Arts (WA)
  "56105", // Department of Education and Training (Vic)
  "38438", // Department of Communities and Justice (NSW)
  "18255", // Brisbane City Council
  "131268", // Sunshine Coast Regional Council
  "45434", // Cambelltown Council
  "132868", // State Library of NSW
  "132616", // Ipswich City Council
  "17807", // State Library of Queensland
  "56318", // Queensland Rail
  "136612", // Queenaland Rail
  "46014", // Country Fire Authority (Vic)
  "135675", // Queensland Local Government Superannuation Board
  "24502", // Parliament of Western Australia
  "136154", // Rockhampton City Council
  "135287", // The Council of the City of Sydney
  "150680", // NSW Fire Brigades
  "138488", // Moonee Valley City Council
  "138367", // Transport for NSW
  "137529", // Sydney Opera House Trust
  "132619", // Police Department (Victoria)
  "133015", // City of Stirling
  "139666", // City of Charles Sturt
  "139222", // City of Wanneroo
  "134678", // Port Stephens Council
  "10213", // Work cover (SA)
  "32812", // Central Coast Council
  "141684", // Department of Customer Service (NSW)
  "138469", // Victorian Gambling and Casion Control Commission
  "138216", // Burwood Council
  "134164", // NSW Government Telecommunications Authority
  "151047", // Queensland Urban Utilities
  "134070", // Legal Aid Commission of NSW
  "132503", // Waverley Council
  "136774", // Western Australian Electoral Commission
];

const cacheExpire = 1000 * 60 * 60 * 24 * 7;

const fetchASNPrefixes = async (asn: string) => {
  try {
    const res = await fetch(`https://api.bgpview.io/asn/${asn}/prefixes`);
    const data = ASNPrefixesQueryResult.parse(await res.json());
    return data;
  } catch (e) {
    return null;
  }
};

export const getCachedASNPrefixes = async (
  asn: string,
  now: number = Date.now()
) => {
  let cached: CachedASNPrefixesQueryResult;
  try {
    const queryResult: any = getCached.get({ $asn: asn });

    cached = CachedASNPrefixesQueryResult.parse(JSON.parse(queryResult.data));
    if (cached.ts < now - cacheExpire) {
      throw new Error("Cached query has expired");
    }
  } catch (e) {
    console.log(`Refreshing cached ASN data for ${asn}`);

    // Either the query has never been cached or it has expired.
    const result = await fetchASNPrefixes(asn);

    if (result !== null) {
      const data: CachedASNPrefixesQueryResult = {
        ts: now,
        result,
      };
      setCached.run({ $asn: asn, $data: JSON.stringify(data) });
    }
    return result;
  }

  return cached.result;
};

export async function* fetchPrefixes(asns: string[]) {
  for (let i = 0; i < asns.length; i++) {
    const asn = asns[i];
    const data = await getCachedASNPrefixes(asn);
    if (data === null) return;
    for (let j = 0; j < data.data.ipv4_prefixes.length; j++) {
      yield data.data.ipv4_prefixes[j];
    }
  }
}
