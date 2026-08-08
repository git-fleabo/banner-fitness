import "server-only";

import { notFound } from "next/navigation";

import { getServerEnv } from "@/lib/env";

export const PREVIEW_LEARNER_ID = "00000000-0000-4000-8000-000000000001";

export function requireLearnerPreview(token: string | undefined) {
  const expectedToken = getServerEnv().LEARNER_PREVIEW_TOKEN;
  if (!expectedToken || !token || token !== expectedToken) notFound();
}
