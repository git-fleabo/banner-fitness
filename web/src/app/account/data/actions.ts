"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getAccountAccess } from "@/lib/authorization/server";
import { parseProgressDataAction } from "@/lib/account/data-controls";
import { getDb } from "@/lib/db/client";
import { bookmarks, lessonProgress, practiceAttempts, reviewQueue } from "@/lib/db/schema";

export async function changeProgressData(formData: FormData) {
  const values = parseProgressDataAction(Object.fromEntries(formData));
  const access = await getAccountAccess();
  if (access.state !== "active") throw new Error("An active account is required.");
  const learnerId = access.account.authUserId;
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx.delete(reviewQueue).where(eq(reviewQueue.learnerId, learnerId));
    await tx.delete(practiceAttempts).where(eq(practiceAttempts.learnerId, learnerId));
    await tx.delete(lessonProgress).where(eq(lessonProgress.learnerId, learnerId));
    if (values.intent === "delete") await tx.delete(bookmarks).where(eq(bookmarks.learnerId, learnerId));
  });

  redirect(`/account/data?done=${values.intent}`);
}
