import { Database } from "bun:sqlite";
const db = new Database("db.sqlite");

export const getCached = db.query(
  "select data from cached_asn_data where asn = $asn;"
);

export const setCached = db.query(
  `INSERT INTO cached_asn_data (asn,data) VALUES($asn,$data) ON CONFLICT(asn) DO UPDATE SET data=excluded.data;`
);

export const getLastRun = db.query<{ value: string }, null>(
  "select value from kv where key = 'last_run'"
);
export const setLastRun = db.query<null, string>(
  "INSERT INTO kv(key,value) VALUES('last_run', $value) ON CONFLICT(key) DO UPDATE SET value=excluded.value;"
);

export const addPost = db.query(
  `INSERT INTO posts (text, data) values ($text, $data)`
);
