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

const optionalDigits = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^\d+$/, "Must contain only digits").optional()
);

const optionalImei = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^\d+$/, "IMEI must contain only digits").max(15, "IMEI must be at most 15 digits").optional()
);

export const onboardingSchema = z.object({
  businessName: optionalString,
  partnerFirstName: optionalString,
  partnerSurname: optionalString,
  phoneNumber: optionalString,
  paymentWallet: optionalString,
  ghanaCardNumber: optionalString,
  ghanaCardFrontUrl: optionalUrl,
  ghanaCardBackUrl: optionalUrl,
  passportPhotoUrl: optionalUrl,
  taxIdentityNumber: optionalString,
  businessCertificateUrl: optionalUrl,
  fireCertificateUrl: optionalUrl,
  insuranceUrl: optionalUrl,
  apn: optionalDigits,
  mifiImei: optionalImei,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
