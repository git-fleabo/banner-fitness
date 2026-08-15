"use client";

import type { ReactNode } from "react";

/** Route-level seams keep the dashboard, client workspace and onboarding
 * surfaces independently testable while their internal controls are migrated.
 */
export function DesignerDashboardRoute({ children }: { children: ReactNode }) {
  return <div data-designer-route="dashboard">{children}</div>;
}

export function ClientWorkspaceRoute({ children }: { children: ReactNode }) {
  return <div data-designer-route="client-workspace">{children}</div>;
}

export function OnboardingRoute({ children }: { children: ReactNode }) {
  return <div data-designer-route="onboarding">{children}</div>;
}
