import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

async function main() {
  loadEnvConfig(process.cwd());
  const databaseUrl = z.string().url().startsWith("postgresql://").parse(process.env.DATABASE_URL);
  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      (select count(*)::int from lesson_versions where status = 'draft') as draft_lessons,
      (select count(*)::int from lesson_versions where status = 'published') as published_lessons,
      (select count(*)::int from learning_object_versions where status = 'draft') as draft_objects,
      (select count(*)::int from question_versions where status = 'draft') as draft_questions,
      (select count(*)::int from glossary_versions where status = 'draft') as draft_glossary,
      (select count(*)::int from source_links) as source_links
  `;

  const result = z.object({
    draft_lessons: z.number(),
    published_lessons: z.number(),
    draft_objects: z.number(),
    draft_questions: z.number(),
    draft_glossary: z.number(),
    source_links: z.number(),
  }).parse(rows[0]);

  if (result.draft_lessons !== 5 || result.published_lessons !== 0 || result.draft_objects !== 31 || result.draft_questions !== 24 || result.draft_glossary !== 25 || result.source_links < 85) {
    throw new Error(`Unexpected prototype inventory: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
