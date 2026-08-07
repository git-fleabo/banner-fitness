import { redirect } from "next/navigation";

import { ReferenceIndex } from "@/components/reference-index";
import { getAccountAccess } from "@/lib/authorization/server";
import { listGlossaryTerms } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

export default async function ReferencePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");

  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q : "";
  const selectedSlug = typeof query.term === "string" ? query.term : undefined;
  const terms = await listGlossaryTerms(access.account.role);

  return <ReferenceIndex terms={terms} query={search} selectedSlug={selectedSlug} ownerPreview={access.account.role === "owner"} />;
}
