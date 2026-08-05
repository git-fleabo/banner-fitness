import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getServerEnv } from "@/lib/env";
import * as schema from "@/lib/db/schema";

export function getSql() {
  return neon(getServerEnv().DATABASE_URL);
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
