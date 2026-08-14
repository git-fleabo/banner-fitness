"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getAccountAccess } from "@/lib/authorization/server";
import { parseClientDataAction } from "@/lib/account/data-controls";
import { getDb } from "@/lib/db/client";
import { ptClients, ptDesignerSettings, ptExercises, ptProgrammeTemplates } from "@/lib/db/schema";

export async function deleteClientData(formData: FormData) {
  parseClientDataAction(Object.fromEntries(formData));
  const access = await getAccountAccess();
  if (access.state !== "active" || !["owner", "pt"].includes(access.account.role)) throw new Error("An active PT account is required.");

  const ownerProfileId = access.account.authUserId;
  const db = getDb();
  await db.delete(ptClients).where(eq(ptClients.ownerProfileId, ownerProfileId));
  await db.delete(ptProgrammeTemplates).where(eq(ptProgrammeTemplates.ownerProfileId, ownerProfileId));
  await db.delete(ptExercises).where(eq(ptExercises.ownerProfileId, ownerProfileId));
  await db.delete(ptDesignerSettings).where(eq(ptDesignerSettings.ownerProfileId, ownerProfileId));

  redirect("/account/data?done=delete");
}
