import "server-only";

import { notFound } from "next/navigation";

import { getServerEnv } from "@/lib/env";

export const PREVIEW_LEARNER_ID = "00000000-0000-4000-8000-000000000001";

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

export function requireLearnerPreview(token: string | undefined) {
  const expectedToken = getServerEnv().LEARNER_PREVIEW_TOKEN;
  if (!expectedToken || !token || !constantTimeEqual(token, expectedToken)) notFound();
}
