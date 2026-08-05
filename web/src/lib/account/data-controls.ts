import { z } from "zod";

export const progressDataActionSchema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("reset"), confirmation: z.literal("RESET PROGRESS") }),
  z.object({ intent: z.literal("delete"), confirmation: z.literal("DELETE LEARNING DATA") }),
]);

export function parseProgressDataAction(value: unknown) {
  return progressDataActionSchema.parse(value);
}
