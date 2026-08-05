import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";

async function main() {
  loadEnvConfig(process.cwd());

  const [schema, { seedPrototypeDrafts }] = await Promise.all([
    import("../src/lib/db/schema"),
    import("../src/lib/content/seed-service"),
  ]);

  const databaseUrl = z.string().url().startsWith("postgresql://").parse(process.env.DATABASE_URL);
  const db = drizzle(neon(databaseUrl), { schema });
  const [owner] = await db.select({ id: schema.profiles.authUserId }).from(schema.profiles).where(
    // The seed is an owner-authored draft and must never silently attach itself to a learner.
    and(eq(schema.profiles.role, "owner"), eq(schema.profiles.status, "active")),
  ).limit(1);

  if (!owner) throw new Error("An active owner profile is required before seeding prototype content.");

  const result = await seedPrototypeDrafts(db, owner.id);
  console.log(`Seeded draft prototype: ${result.lessons} lessons, ${result.learningObjects} learning objects, ${result.questions} questions, ${result.glossaryTerms} glossary terms and ${result.misconceptions} named misconceptions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
