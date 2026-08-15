import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  DEV_BYPASS_AUTH: z.string().optional().transform((v) => v === "true"),
  LEARNER_PREVIEW_TOKEN: z.string().min(20).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid server environment: ${z.prettifyError(result.error)}`);
  }

  if (result.data.DEV_BYPASS_AUTH && process.env.NODE_ENV === "production") {
    throw new Error("DEV_BYPASS_AUTH cannot be enabled when NODE_ENV=production");
  }

  return result.data;
}
