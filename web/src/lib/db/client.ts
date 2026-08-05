import "server-only";

import { neon } from "@neondatabase/serverless";

import { getServerEnv } from "@/lib/env";

export function getSql() {
  return neon(getServerEnv().DATABASE_URL);
}
