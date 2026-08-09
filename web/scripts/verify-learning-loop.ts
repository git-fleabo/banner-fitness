import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

async function main() {
  loadEnvConfig(process.cwd());
  const databaseUrl = z.string().url().startsWith("postgresql://").parse(process.env.DATABASE_URL);
  const sql = neon(databaseUrl);
  const rows = await sql`
    select
      lp.coverage_state,
      lp.resume_state ->> 'confidence' as confidence,
      (select count(*)::int from practice_attempts pa where pa.learner_id = p.auth_user_id and pa.lesson_version_id = lp.lesson_version_id) as attempts,
      (select count(*)::int from review_queue rq where rq.learner_id = p.auth_user_id and rq.lesson_id = l.id and rq.status = 'queued') as queued_reviews,
      (select count(*)::int from review_queue rq where rq.learner_id = p.auth_user_id and rq.lesson_id = l.id and rq.reason = 'misconception') as misconception_reviews
    from profiles p
    join lesson_progress lp on lp.learner_id = p.auth_user_id
    join lessons l on l.id = lp.lesson_id
    where p.role = 'owner' and p.status = 'active' and l.slug = 'planes-and-axes'
    limit 1
  `;
  if (!rows[0]) {
    console.log(JSON.stringify({ status: "no_owner_progress_fixture", note: "No owner lesson progress exists; this read-only check does not create learner data." }));
    return;
  }

  const result = z.object({
    coverage_state: z.enum(["not_started", "in_progress", "covered"]),
    confidence: z.string().nullable(),
    attempts: z.number().int().min(0),
    queued_reviews: z.number().int().min(0),
    misconception_reviews: z.number().int().min(0),
  }).parse(rows[0]);
  const [resumeRow] = await sql`
    select
      lp.coverage_state,
      lp.resume_state ->> 'stepStableKey' as step_stable_key,
      lp.resume_state -> 'selected' ->> 0 as selected,
      (lp.resume_state ->> 'submitted')::boolean as submitted,
      (lp.resume_state ->> 'evidenceRecorded')::boolean as evidence_recorded,
      rq.learner_override ->> 'intent' as override_intent
    from profiles p
    join lesson_progress lp on lp.learner_id = p.auth_user_id
    join lessons l on l.id = lp.lesson_id
    join review_queue rq on rq.learner_id = p.auth_user_id and rq.lesson_id = l.id and rq.status = 'queued'
    where p.role = 'owner' and p.status = 'active' and l.slug = 'joint-actions'
    limit 1
  `;
  const resume = resumeRow ? z.object({
    coverage_state: z.enum(["not_started", "in_progress", "covered"]),
    step_stable_key: z.string().nullable(),
    selected: z.string().nullable(),
    submitted: z.boolean().nullable(),
    evidence_recorded: z.boolean().nullable(),
    override_intent: z.string().nullable(),
  }).parse(resumeRow) : null;
  console.log(JSON.stringify({ status: "read_only_live_inventory", completedLesson: result, resumedLesson: resume, note: "A positive owner-demo fixture is optional; this check does not create or alter learner data." }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
