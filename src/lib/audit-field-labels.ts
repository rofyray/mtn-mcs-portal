/**
 * Human-readable labels for entity field names used in audit change tracking.
 */

const FIELD_LABELS: Record<string, string> = {
  // Partner profile fields
  businessName: "Business Name",
  partnerFirstName: "First Name",
  partnerSurname: "Surname",
  phoneNumber: "Phone Number",
  paymentWallet: "Payment Wallet",
  ghanaCardNumber: "Ghana Card Number",
  ghanaCardFrontUrl: "Ghana Card Front",
  ghanaCardBackUrl: "Ghana Card Back",
  passportPhotoUrl: "Passport Photo",
  taxIdentityNumber: "Tax Identity Number",
  businessCertificateUrl: "Business Certificate",
  fireCertificateUrl: "Fire Certificate",
  insuranceUrl: "Insurance Document",
  apn: "APN",
  mifiImei: "MiFi IMEI",

  // Agent fields
  firstName: "First Name",
  surname: "Surname",
  email: "Email",
  cpAppNumber: "CP App Number",
  agentUsername: "Agent Username",
  minervaReferralCode: "Minerva Referral Code",

  // Business / location fields
  addressRegionCode: "Region",
  addressSbuCode: "SBU",
  addressDistrictCode: "District",
  addressCode: "Address Code",
  gpsLatitude: "GPS Latitude",
  gpsLongitude: "GPS Longitude",
  city: "City",
  landmark: "Landmark",
  storeFrontUrl: "Store Front Photo",
  storeInsideUrl: "Store Inside Photo",

  // Onboard request fields
  dateOfIncorporation: "Date of Incorporation",
  businessType: "Business Type",
  businessTypeOther: "Business Type (Other)",
  registeredNature: "Registered Nature",
  registrationCertNo: "Registration Certificate No.",
  mainOfficeLocation: "Main Office Location",
  regionCode: "Region",
  sbuCode: "SBU",
  tinNumber: "TIN Number",
  postalAddress: "Postal Address",
  physicalAddress: "Physical Address",
  companyPhone: "Company Phone",
  digitalPostAddress: "Digital Post Address",
  authorizedSignatory: "Authorized Signatory",
  contactPerson: "Contact Person",
  pepDeclaration: "PEP Declaration",
  imageUrls: "Photos",
  completionDate: "Completion Date",
};

/** Fields that contain file/image URLs */
export const URL_FIELDS = new Set([
  "ghanaCardFrontUrl",
  "ghanaCardBackUrl",
  "passportPhotoUrl",
  "businessCertificateUrl",
  "fireCertificateUrl",
  "insuranceUrl",
  "storeFrontUrl",
  "storeInsideUrl",
]);

/**
 * Get a human-readable label for a camelCase field name.
 * Falls back to converting camelCase → Title Case.
 */
export function getFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  // camelCase → Title Case fallback
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
