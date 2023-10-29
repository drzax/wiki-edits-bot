// @ts-check
import { createRestAPIClient } from "masto";
import { fetchPrefixes } from "./asns.js";
import { federal as federalAsns } from "../data/asns.js";
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

  const prefixes = fetchPrefixes(federalAsns);
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

  newContributions.forEach(async (d) => {
    const text = `Someone on a network controlled by ${d.prefix.description} (${d.contribution.user}) edited the ${d.contribution.title} Wikipedia page anonymously.\n\n${d.contribution.comment}\n\nhttps://en.wikipedia.org/w/index.php?diff=prev&oldid=${d.contribution.revid}`;

    if (process.argv.includes("--dry")) {
      console.log(`Would post: ${text}`);
    } else {
      const status =
        masto &&
        (await masto.v1.statuses.create({
          status: text,
          visibility: "unlisted",
        }));

      postsFile.write(JSON.stringify({ text, data: d, status }) + "\n");
      if (status) console.log(`Posted ${status.url}`);
    }
  });

  // Update the state file
  state.lastRun = now;
  writeFile(STATE_FILE, JSON.stringify(state, undefined, 2), "utf-8");
};

go();
