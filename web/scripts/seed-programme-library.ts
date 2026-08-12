import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";

async function main() {
  loadEnvConfig(process.cwd());

  const [{ profiles, ptProgrammeTemplates }, { programmeLibrarySeed }] = await Promise.all([
    import("../src/lib/db/schema"),
    import("../src/lib/programme-library"),
  ]);
  const databaseUrl = z.string().url().startsWith("postgresql://").parse(process.env.DATABASE_URL);
  const db = drizzle(neon(databaseUrl), { schema: await import("../src/lib/db/schema") });
  const owners = await db.select({ id: profiles.authUserId, email: profiles.email }).from(profiles).where(and(eq(profiles.role, "owner"), eq(profiles.status, "active")));
  if (!owners.length) throw new Error("An active owner profile is required before seeding the programme library.");

  let inserted = 0;
  let alreadyPresent = 0;
  for (const owner of owners) {
    for (const template of programmeLibrarySeed) {
      const [existing] = await db.select({ id: ptProgrammeTemplates.id }).from(ptProgrammeTemplates).where(and(eq(ptProgrammeTemplates.ownerProfileId, owner.id), eq(ptProgrammeTemplates.name, template.label))).limit(1);
      if (existing) {
        await db.update(ptProgrammeTemplates).set({ goalSummary: template.goal, experienceLevel: template.experienceLevel ?? "varied", frameworkType: template.frameworkType ?? "original" }).where(eq(ptProgrammeTemplates.id, existing.id));
        alreadyPresent += 1;
        continue;
      }
      await db.insert(ptProgrammeTemplates).values({
        ownerProfileId: owner.id,
        name: template.label,
        description: template.description,
        goalSummary: template.goal,
        sessionDurationMinutes: template.sessionDurationMinutes ?? 45,
        experienceLevel: template.experienceLevel ?? "varied",
        frameworkType: template.frameworkType ?? "original",
        sessions: template.sessions,
      });
      inserted += 1;
    }
    console.log(`Programme library checked for ${owner.email}.`);
  }
  console.log(`Programme library seed complete: ${inserted} inserted, ${alreadyPresent} already present, ${programmeLibrarySeed.length} catalogue templates per active owner.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
