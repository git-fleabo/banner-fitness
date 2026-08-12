import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { bookmarks, lessonProgress, practiceAttempts, reviewQueue } from "@/lib/db/schema";

export async function GET() {
  const access = await getAccountAccess();
  if (access.state !== "active") return NextResponse.json({ error: "An active account is required." }, { status: 401 });
  const learnerId = access.account.authUserId;
  const db = getDb();
  const [progress, attempts, reviews, savedBookmarks] = await Promise.all([
    db.select().from(lessonProgress).where(eq(lessonProgress.learnerId, learnerId)),
    db.select().from(practiceAttempts).where(eq(practiceAttempts.learnerId, learnerId)),
    db.select().from(reviewQueue).where(eq(reviewQueue.learnerId, learnerId)),
    db.select().from(bookmarks).where(eq(bookmarks.learnerId, learnerId)),
  ]);
  const body = JSON.stringify({
    exportedAt: new Date().toISOString(),
    account: { email: access.account.email, role: access.account.role },
    lessonProgress: progress,
    practiceAttempts: attempts,
    reviewQueue: reviews,
    bookmarks: savedBookmarks,
  }, null, 2);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="pt-learning-lab-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
