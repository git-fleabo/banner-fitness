"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { reviewQueue } from "@/lib/db/schema";

const overrideSchema = z.object({
  reviewId: z.string().uuid(),
  intent: z.enum(["tomorrow", "three_days", "dismiss"]),
});

export async function updateReviewRecommendation(formData: FormData) {
  const values = overrideSchema.parse(Object.fromEntries(formData));
  const access = await getAccountAccess();
  if (access.state !== "active") throw new Error("An active account is required.");

  const db = getDb();
  const updatedAt = new Date();
  const learnerOverride = { intent: values.intent, changedAt: updatedAt.toISOString() };
  const set = values.intent === "dismiss"
    ? { status: "dismissed" as const, learnerOverride, updatedAt }
    : {
        status: "queued" as const,
        dueAt: new Date(updatedAt.getTime() + (values.intent === "tomorrow" ? 1 : 3) * 86_400_000),
        learnerOverride,
        updatedAt,
      };

  const [updated] = await db
    .update(reviewQueue)
    .set(set)
    .where(and(eq(reviewQueue.id, values.reviewId), eq(reviewQueue.learnerId, access.account.authUserId)))
    .returning({ id: reviewQueue.id });
  if (!updated) throw new Error("This recommendation is not available to this account.");

  revalidatePath("/review");
}
