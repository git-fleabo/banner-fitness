import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid server environment: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}
