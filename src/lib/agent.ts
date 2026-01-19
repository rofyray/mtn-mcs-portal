import { z } from "zod";

export const agentSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1),
  email: z.string().email(),
  cpAppNumber: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).optional()
  ),
  ghanaCardNumber: z.string().trim().min(1),
  ghanaCardFrontUrl: z.string().url(),
  ghanaCardBackUrl: z.string().url(),
  passportPhotoUrl: z.string().url(),
  addressRegionCode: z.string().trim().min(1),
  addressDistrictCode: z.string().trim().min(1),
  addressCode: z.string().trim().min(1),
  city: z.string().trim().min(1),
  businessName: z.string().trim().min(1),
});

export type AgentInput = z.infer<typeof agentSchema>;

export const agentUpdateSchema = agentSchema.partial().extend({
  ghanaCardFrontUrl: z.string().url().nullable().optional(),
  ghanaCardBackUrl: z.string().url().nullable().optional(),
  passportPhotoUrl: z.string().url().nullable().optional(),
});
