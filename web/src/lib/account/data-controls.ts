import { z } from "zod";

export const clientDataActionSchema = z.object({ intent: z.literal("delete"), confirmation: z.literal("DELETE PT DATA") });

export function parseClientDataAction(value: unknown) {
  return clientDataActionSchema.parse(value);
}
