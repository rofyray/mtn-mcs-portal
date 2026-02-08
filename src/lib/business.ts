import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
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
});

export type BusinessInput = z.infer<typeof businessSchema>;

export const businessUpdateSchema = businessSchema.partial().extend({
  storeFrontUrl: z.string().url("Store front photo is required").nullable().optional(),
  storeInsideUrl: z.string().url("Store inside photo is required").nullable().optional(),
});
