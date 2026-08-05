import { z } from "zod";

export const accountRoleSchema = z.enum(["owner", "learner"]);
export const accountStatusSchema = z.enum(["invited", "active", "blocked"]);

export type AccountRole = z.infer<typeof accountRoleSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
