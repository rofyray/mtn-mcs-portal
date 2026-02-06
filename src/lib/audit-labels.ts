const ACTION_LABELS: Record<string, string> = {
  PARTNER_APPROVED: "Partner Approved",
  PARTNER_DENIED: "Partner Denied",
  PARTNER_EDITED: "Partner Edited",
  PARTNER_EXPIRED: "Partner Expired",
  AGENT_APPROVED: "Agent Approved",
  AGENT_DENIED: "Agent Denied",
  AGENT_EDITED: "Agent Edited",
  AGENT_EXPIRED: "Agent Expired",
  BUSINESS_APPROVED: "Business Approved",
  BUSINESS_DENIED: "Business Denied",
  BUSINESS_EDITED: "Business Edited",
  BUSINESS_EXPIRED: "Business Expired",
  ADMIN_REGION_ASSIGNED: "Admin Region Assigned",
  ADMIN_REGION_REMOVED: "Admin Region Removed",
  ADMIN_ENABLED: "Admin Enabled",
  ADMIN_DISABLED: "Admin Disabled",
  FORM_SENT: "Form Sent",
  FORM_SIGNED: "Form Signed",
  DATA_REQUEST_CREATED: "Data Request Created",
  DATA_REQUEST_SUBMITTED_TO_MANAGER: "Data Request Sent to Manager",
  DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "Data Request Sent to Senior Manager",
  DATA_REQUEST_SUBMITTED_TO_LEGAL: "Data Request Sent to Legal",
  DATA_REQUEST_APPROVED: "Data Request Approved",
  DATA_REQUEST_DENIED: "Data Request Denied",
};

const ACTION_AREAS: Record<string, string> = {
  PARTNER_APPROVED: "Partner",
  PARTNER_DENIED: "Partner",
  PARTNER_EDITED: "Partner",
  PARTNER_EXPIRED: "Partner",
  AGENT_APPROVED: "Agent",
  AGENT_DENIED: "Agent",
  AGENT_EDITED: "Agent",
  AGENT_EXPIRED: "Agent",
  BUSINESS_APPROVED: "Business",
  BUSINESS_DENIED: "Business",
  BUSINESS_EDITED: "Business",
  BUSINESS_EXPIRED: "Business",
  ADMIN_REGION_ASSIGNED: "Admin",
  ADMIN_REGION_REMOVED: "Admin",
  ADMIN_ENABLED: "Admin",
  ADMIN_DISABLED: "Admin",
  FORM_SENT: "Form",
  FORM_SIGNED: "Form",
  DATA_REQUEST_CREATED: "Data Request",
  DATA_REQUEST_SUBMITTED_TO_MANAGER: "Data Request",
  DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "Data Request",
  DATA_REQUEST_SUBMITTED_TO_LEGAL: "Data Request",
  DATA_REQUEST_APPROVED: "Data Request",
  DATA_REQUEST_DENIED: "Data Request",
};

const ACTION_CATEGORIES: Record<string, "success" | "warning" | "error" | "info"> = {
  PARTNER_APPROVED: "success",
  PARTNER_DENIED: "error",
  PARTNER_EDITED: "info",
  PARTNER_EXPIRED: "warning",
  AGENT_APPROVED: "success",
  AGENT_DENIED: "error",
  AGENT_EDITED: "info",
  AGENT_EXPIRED: "warning",
  BUSINESS_APPROVED: "success",
  BUSINESS_DENIED: "error",
  BUSINESS_EDITED: "info",
  BUSINESS_EXPIRED: "warning",
  ADMIN_REGION_ASSIGNED: "info",
  ADMIN_REGION_REMOVED: "warning",
  ADMIN_ENABLED: "success",
  ADMIN_DISABLED: "warning",
  FORM_SENT: "info",
  FORM_SIGNED: "success",
  DATA_REQUEST_CREATED: "info",
  DATA_REQUEST_SUBMITTED_TO_MANAGER: "info",
  DATA_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "info",
  DATA_REQUEST_SUBMITTED_TO_LEGAL: "info",
  DATA_REQUEST_APPROVED: "success",
  DATA_REQUEST_DENIED: "error",
};

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function getActionArea(action: string): string {
  return ACTION_AREAS[action] ?? "System";
}

export type ActionCategory = "success" | "warning" | "error" | "info";

export function getActionCategory(action: string): ActionCategory {
  return ACTION_CATEGORIES[action] ?? "info";
}
