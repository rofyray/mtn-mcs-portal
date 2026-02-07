import { z } from "zod";

export const agentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  email: z.string().email("A valid email address is required"),
  cpAppNumber: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).optional()
  ),
  agentUsername: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).optional()
  ),
  minervaReferralCode: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().regex(/^[a-zA-Z0-9]+$/, "Referral code must be alphanumeric").optional()
  ),
  ghanaCardNumber: z.string().trim().min(1, "Ghana card number is required"),
  ghanaCardFrontUrl: z.string().url("Ghana card front image is required"),
  ghanaCardBackUrl: z.string().url("Ghana card back image is required"),
  passportPhotoUrl: z.string().url("Passport photo is required"),
  businessId: z.string().trim().min(1, "Business location is required"),
  businessName: z.string().trim().min(1, "Business name is required"),
});

export type AgentInput = z.infer<typeof agentSchema>;

export const agentUpdateSchema = agentSchema.partial().extend({
  ghanaCardFrontUrl: z.string().url("Ghana card front image is required").nullable().optional(),
  ghanaCardBackUrl: z.string().url("Ghana card back image is required").nullable().optional(),
  passportPhotoUrl: z.string().url("Passport photo is required").nullable().optional(),
});
