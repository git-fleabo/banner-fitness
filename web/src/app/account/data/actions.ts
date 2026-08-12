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
  // neon-http deliberately does not implement Drizzle transactions. Snapshot the
  // scoped rows and restore them if a later delete fails.
  const [oldReviewQueue, oldAttempts, oldProgress, oldBookmarks] = await Promise.all([
    db.select().from(reviewQueue).where(eq(reviewQueue.learnerId, learnerId)),
    db.select().from(practiceAttempts).where(eq(practiceAttempts.learnerId, learnerId)),
    db.select().from(lessonProgress).where(eq(lessonProgress.learnerId, learnerId)),
    values.intent === "delete" ? db.select().from(bookmarks).where(eq(bookmarks.learnerId, learnerId)) : Promise.resolve([]),
  ]);
  try {
    await db.delete(reviewQueue).where(eq(reviewQueue.learnerId, learnerId));
    await db.delete(practiceAttempts).where(eq(practiceAttempts.learnerId, learnerId));
    await db.delete(lessonProgress).where(eq(lessonProgress.learnerId, learnerId));
    if (values.intent === "delete") await db.delete(bookmarks).where(eq(bookmarks.learnerId, learnerId));
  } catch (error) {
    if (oldReviewQueue.length) await db.insert(reviewQueue).values(oldReviewQueue);
    if (oldAttempts.length) await db.insert(practiceAttempts).values(oldAttempts);
    if (oldProgress.length) await db.insert(lessonProgress).values(oldProgress);
    if (oldBookmarks.length) await db.insert(bookmarks).values(oldBookmarks);
    throw error;
  }

  redirect(`/account/data?done=${values.intent}`);
}
