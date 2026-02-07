export type OnboardRequestFormData = {
  businessName: string;
  dateOfIncorporation: string;
  businessType: string;
  businessTypeOther: string;
  registeredNature: string;
  registrationCertNo: string;
  mainOfficeLocation: string;
  regionCode: string;
  tinNumber: string;
  postalAddress: string;
  physicalAddress: string;
  companyPhone: string;
  digitalPostAddress: string;
  authorizedSignatory: {
    name: string;
    designation: string;
    phone: string;
    email: string;
    date: string;
  };
  contactPerson: {
    name: string;
    designation: string;
    phone: string;
    email: string;
    date: string;
  };
  pepDeclaration: {
    q1: string;
    q2: string;
    q2Timeframe: string;
    q3: string;
    q3Name: string;
    q3Position: string;
    q3Year: string;
    q3Relationship: string;
  };
  imageUrls: string[];
  completionDate: string;
  comments: string;
  signatureUrl: string;
};

export const INITIAL_FORM: OnboardRequestFormData = {
  businessName: "",
  dateOfIncorporation: "",
  businessType: "",
  businessTypeOther: "",
  registeredNature: "",
  registrationCertNo: "",
  mainOfficeLocation: "",
  regionCode: "",
  tinNumber: "",
  postalAddress: "",
  physicalAddress: "",
  companyPhone: "",
  digitalPostAddress: "",
  authorizedSignatory: { name: "", designation: "", phone: "", email: "", date: "" },
  contactPerson: { name: "", designation: "", phone: "", email: "", date: "" },
  pepDeclaration: {
    q1: "",
    q2: "",
    q2Timeframe: "",
    q3: "",
    q3Name: "",
    q3Position: "",
    q3Year: "",
    q3Relationship: "",
  },
  imageUrls: [],
  completionDate: "",
  comments: "",
  signatureUrl: "",
};

export const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company",
  "Other",
];

export const REGISTERED_NATURES = [
  "Distribution",
  "Financial Services",
  "Retail",
  "Telecommunications",
  "Wholesale",
  "Other",
];
