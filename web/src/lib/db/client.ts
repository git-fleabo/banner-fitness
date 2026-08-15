import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getServerEnv } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let localDb: ReturnType<typeof createLocalDb> | undefined;

function createLocalDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle: drizzleNodePostgres } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
  return drizzleNodePostgres(new Pool({ connectionString: getServerEnv().DATABASE_URL }), { schema }) as unknown as ReturnType<typeof drizzle>;
}

export function getSql() {
  return neon(getServerEnv().DATABASE_URL);
}

export function getDb(): ReturnType<typeof drizzle> {
  if (getServerEnv().DEV_BYPASS_AUTH) {
    // Keep the local-only TCP driver out of the normal Neon deployment path.
    localDb ??= createLocalDb();
    return localDb;
  }

  return drizzle(getSql(), { schema });
}
