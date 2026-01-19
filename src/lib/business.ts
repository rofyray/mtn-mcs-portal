import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional()
);

export const businessSchema = z.object({
  businessName: z.string().trim().min(1),
  addressRegionCode: z.string().trim().min(1),
  addressDistrictCode: z.string().trim().min(1),
  addressCode: z.string().trim().min(1),
  gpsLatitude: optionalString,
  gpsLongitude: optionalString,
  city: z.string().trim().min(1),
  landmark: optionalString,
  storeFrontUrl: z.string().url(),
  storeInsideUrl: z.string().url(),
});

export type BusinessInput = z.infer<typeof businessSchema>;

export const businessUpdateSchema = businessSchema.partial().extend({
  storeFrontUrl: z.string().url().nullable().optional(),
  storeInsideUrl: z.string().url().nullable().optional(),
});
