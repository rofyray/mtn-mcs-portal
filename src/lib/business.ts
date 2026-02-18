import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
);

const optionalDigits = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^\d+$/, "Must contain only digits").optional()
);

const optionalImei = z.preprocess(
  emptyToUndefined,
  z.string().trim().regex(/^\d+$/, "IMEI must contain only digits").max(15, "IMEI must be at most 15 digits").optional()
);

export const businessSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  addressRegionCode: z.string().trim().min(1, "Region is required"),
  addressSbuCode: optionalString,
  addressDistrictCode: z.string().trim().min(1, "District is required"),
  addressCode: z.string().trim().min(1, "Digital address code is required"),
  gpsLatitude: optionalString,
  gpsLongitude: optionalString,
  city: z.string().trim().min(1, "City is required"),
  landmark: optionalString,
  storeFrontUrl: z.string().url("Store front photo is required"),
  storeInsideUrl: z.string().url("Store inside photo is required"),
  fireCertificateUrl: z.string().url("Fire certificate is required"),
  insuranceUrl: z.string().url("Insurance document is required"),
  apn: optionalDigits,
  mifiImei: optionalImei,
});

export type BusinessInput = z.infer<typeof businessSchema>;

export const businessUpdateSchema = businessSchema.partial().extend({
  storeFrontUrl: z.string().url("Store front photo is required").nullable().optional(),
  storeInsideUrl: z.string().url("Store inside photo is required").nullable().optional(),
  fireCertificateUrl: z.string().url("Fire certificate is required").nullable().optional(),
  insuranceUrl: z.string().url("Insurance document is required").nullable().optional(),
});
