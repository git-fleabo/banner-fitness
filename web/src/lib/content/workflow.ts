export type ReviewTransition = "in_review" | "approved" | "published";

export type ReviewGate = {
  currentStatus: "draft" | "in_review" | "approved" | "published" | "retired";
  targetStatus: ReviewTransition;
  rationale?: string;
  sourcesComplete: boolean;
  hasMappingUncertainty: boolean;
  mappingAcknowledged: boolean;
  hasApprovedDecision: boolean;
};

export function reviewTransitionError(gate: ReviewGate): string | null {
  if (gate.targetStatus === "in_review") {
    return gate.currentStatus === "draft" ? null : "Only a draft can be sent for review.";
  }
  if (gate.targetStatus === "approved") {
    if (gate.currentStatus !== "in_review") return "Only content in review can be approved.";
    if ((gate.rationale?.trim().length ?? 0) < 10) return "Approval needs a short rationale.";
    if (!gate.sourcesComplete) return "Every lesson object and question needs a source link before approval.";
    if (gate.hasMappingUncertainty && !gate.mappingAcknowledged) return "The recorded curriculum-mapping uncertainty must be acknowledged before approval.";
    return null;
  }
  if (gate.currentStatus !== "approved") return "Only approved content can be published.";
  if (!gate.sourcesComplete) return "Source coverage is incomplete.";
  if (!gate.hasApprovedDecision) return "An approved owner review decision is required before publication.";
  return null;
}
