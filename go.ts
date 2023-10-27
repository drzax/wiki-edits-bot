#!/usr/bin/env bun
import { createRestAPIClient } from "masto";
import { federal as federalAsns, fetchPrefixes } from "./asns";
import { addPost, getLastRun, setLastRun } from "./db";
import { fetchContributions } from "./wikipedia";

const now = Date.now();

const lastRun = parseInt(
  (getLastRun.get(null) || { value: `${now}` }).value,
  10
);

const prefixes = fetchPrefixes(federalAsns);
const newContributions: Awaited<ReturnType<typeof fetchContributions>> = [];

for await (let prefix of prefixes) {
  const contributions = await fetchContributions(prefix);
  contributions.forEach((d) => {
    {
      if (
        new Date(d.contribution.timestamp).getTime() > lastRun &&
        !newContributions.some(
          (dd) => d.contribution.revid === d.contribution.revid
        )
      ) {
        newContributions.push(d);
      }
    }
  });
}

const masto =
  process.env.URL &&
  process.env.ACCESS_TOKEN &&
  createRestAPIClient({
    url: process.env.URL,
    accessToken: process.env.ACCESS_TOKEN,
  });

newContributions.forEach(async (d) => {
  const text = `Someone on a network controlled by ${d.prefix.description} (${d.contribution.user}) edited the ${d.contribution.title} Wikipedia page anonymously.\n\n${d.contribution.comment}\n\nhttps://en.wikipedia.org/w/index.php?diff=prev&oldid=${d.contribution.revid}`;
  addPost.run({ $text: text, $data: JSON.stringify(d) });

  if (masto) {
    const status = await masto.v1.statuses.create({
      status: text,
      visibility: "unlisted",
    });
    console.log(`Posted ${status.url}`);
  }
});

setLastRun.run(`${now}`);
