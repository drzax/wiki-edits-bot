// @ts-check
import { createRestAPIClient } from "masto";
import { fetchPrefixes } from "./asns.js";
import { act, federal, nsw, nt, qld, sa, vic, wa } from "../data/asns.js";
import { fetchContributions } from "./wikipedia.js";
import { readFile, writeFile } from "fs/promises";
import { State } from "./schemas.js";
import { createWriteStream } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "url";

const now = Date.now();
const STATE_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../data/state.json"
);
const POSTS_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../data/posts.jsonl"
);

const go = async () => {
  /** @type { State } */
  const state = JSON.parse(await readFile(STATE_FILE, "utf-8"));
  const { lastRun = now } = state;

  const asns = [
    ...federal,
    ...qld,
    ...nsw,
    ...act,
    ...wa,
    ...nt,
    ...sa,
    ...vic,
  ];

  const prefixes = fetchPrefixes(asns);
  /** @type Awaited<ReturnType<typeof fetchContributions>> */
  const newContributions = [];

  for await (let prefix of prefixes) {
    const contributions = await fetchContributions(prefix);
    contributions.forEach((d) => {
      {
        if (
          new Date(d.contribution.timestamp).getTime() > lastRun &&
          !newContributions.some(
            (dd) => d.contribution.revid === dd.contribution.revid
          )
        ) {
          newContributions.push(d);
        }
      }
    });
  }

  /** @type {{user: string; pageid: number; contributions: typeof newContributions}[]} */
  const group = [];

  // Group sequential contributions to the same page by the same contributor
  const grouped = newContributions.reduce((grouped, record) => {
    const last = grouped[grouped.length - 1];
    if (
      last &&
      last.user === record.contribution.user &&
      last.pageid === record.contribution.pageid
    ) {
      last.contributions.push(record);
      return grouped;
    }
    grouped.push({
      user: record.contribution.user,
      pageid: record.contribution.pageid,
      contributions: [record],
    });
    return grouped;
  }, group);

  let masto =
    process.env.URL &&
    process.env.ACCESS_TOKEN &&
    createRestAPIClient({
      url: process.env.URL,
      accessToken: process.env.ACCESS_TOKEN,
    });

  const postsFile = createWriteStream(POSTS_FILE, {
    encoding: "utf-8",
    flags: "a",
  });

  grouped.forEach(async (group) => {
    const text = `Someone on a network controlled by ${
      group.contributions[0].prefix.description
    } (${group.contributions[0].contribution.user}) edited the ${
      group.contributions[0].contribution.title
    } Wikipedia page anonymously.\n\n${
      group.contributions.length > 1
        ? `${group.contributions.length} edits:\n`
        : ""
    }${group.contributions
      .flatMap(({ contribution: { comment } }) =>
        comment ? [`- ${comment}`] : []
      )
      .join("\n")}\n\nhttps://en.wikipedia.org/w/index.php?diff=${
      group.contributions[0].contribution.revid
    }&oldid=${
      group.contributions[group.contributions.length - 1].contribution.parentid
    }`;

    if (process.argv.includes("--dry")) {
      console.log(`Would post: ${text}`);
    } else {
      const status =
        masto &&
        (await masto.v1.statuses.create({
          status: text,
          visibility: "unlisted",
        }));

      postsFile.write(JSON.stringify({ text, data: group, status }) + "\n");
      if (status) console.log(`Posted ${status.url}`);
    }
  });
  if (!process.argv.includes("--dry")) {
    // Update the state file
    state.lastRun = now;
    writeFile(STATE_FILE, JSON.stringify(state, undefined, 2), "utf-8");
  }
};

go();
