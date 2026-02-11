import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
);

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().nullable().optional()
);

export const onboardingSchema = z.object({
  businessName: optionalString,
  partnerFirstName: optionalString,
  partnerSurname: optionalString,
  phoneNumber: optionalString,
  paymentWallet: optionalString,
  ghanaCardNumber: optionalString,
  passportPhotoUrl: optionalUrl,
  taxIdentityNumber: optionalString,
  businessCertificateUrl: optionalUrl,
  fireCertificateUrl: optionalUrl,
  insuranceUrl: optionalUrl,
  regionCode: optionalString,
  sbuCode: optionalString,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
