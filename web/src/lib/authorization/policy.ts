import type { AccountRole, AccountStatus } from "@/lib/auth/types";

export type AccountIdentity = {
  authUserId: string;
  role: AccountRole;
  status: AccountStatus;
};

export function isActive(account: AccountIdentity): boolean {
  return account.status === "active";
}

export function canAccessOwnedRecord(account: AccountIdentity, learnerId: string): boolean {
  return isActive(account) && (account.role === "owner" || account.authUserId === learnerId);
}

export function canReviewContent(account: AccountIdentity): boolean {
  return isActive(account) && account.role === "owner";
}
