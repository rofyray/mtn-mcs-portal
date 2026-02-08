const ACTION_LABELS: Record<string, string> = {
  PARTNER_APPROVED: "Partner Approved",
  PARTNER_DENIED: "Partner Denied",
  PARTNER_EDITED: "Partner Edited",
  PARTNER_EXPIRED: "Partner Expired",
  AGENT_APPROVED: "Agent Approved",
  AGENT_DENIED: "Agent Denied",
  AGENT_EDITED: "Agent Edited",
  AGENT_EXPIRED: "Agent Expired",
  BUSINESS_APPROVED: "Location Approved",
  BUSINESS_DENIED: "Location Denied",
  BUSINESS_EDITED: "Location Edited",
  BUSINESS_EXPIRED: "Location Expired",
  ADMIN_REGION_ASSIGNED: "Admin Region Assigned",
  ADMIN_REGION_REMOVED: "Admin Region Removed",
  ADMIN_ENABLED: "Admin Enabled",
  ADMIN_DISABLED: "Admin Disabled",
  FORM_SENT: "Form Sent",
  FORM_SIGNED: "Form Signed",
  ONBOARD_REQUEST_CREATED: "Onboard Request Created",
  ONBOARD_REQUEST_SUBMITTED_TO_MANAGER: "Onboard Request Sent to Manager",
  ONBOARD_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "Onboard Request Sent to Senior Manager",
  ONBOARD_REQUEST_SUBMITTED_TO_GOVERNANCE: "Onboard Request Sent to Governance",
  ONBOARD_REQUEST_APPROVED: "Onboard Request Approved",
  ONBOARD_REQUEST_DENIED: "Onboard Request Denied",
  ONBOARD_REQUEST_PUBLIC_SUBMITTED: "Onboard Request Public Submitted",
  ONBOARD_REQUEST_EDITED: "Onboard Request Edited",
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
  BUSINESS_APPROVED: "Location",
  BUSINESS_DENIED: "Location",
  BUSINESS_EDITED: "Location",
  BUSINESS_EXPIRED: "Location",
  ADMIN_REGION_ASSIGNED: "Admin",
  ADMIN_REGION_REMOVED: "Admin",
  ADMIN_ENABLED: "Admin",
  ADMIN_DISABLED: "Admin",
  FORM_SENT: "Form",
  FORM_SIGNED: "Form",
  ONBOARD_REQUEST_CREATED: "Onboard Request",
  ONBOARD_REQUEST_SUBMITTED_TO_MANAGER: "Onboard Request",
  ONBOARD_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "Onboard Request",
  ONBOARD_REQUEST_SUBMITTED_TO_GOVERNANCE: "Onboard Request",
  ONBOARD_REQUEST_APPROVED: "Onboard Request",
  ONBOARD_REQUEST_DENIED: "Onboard Request",
  ONBOARD_REQUEST_PUBLIC_SUBMITTED: "Onboard Request",
  ONBOARD_REQUEST_EDITED: "Onboard Request",
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
  ONBOARD_REQUEST_CREATED: "info",
  ONBOARD_REQUEST_SUBMITTED_TO_MANAGER: "info",
  ONBOARD_REQUEST_SUBMITTED_TO_SENIOR_MANAGER: "info",
  ONBOARD_REQUEST_SUBMITTED_TO_GOVERNANCE: "info",
  ONBOARD_REQUEST_APPROVED: "success",
  ONBOARD_REQUEST_DENIED: "error",
  ONBOARD_REQUEST_PUBLIC_SUBMITTED: "info",
  ONBOARD_REQUEST_EDITED: "info",
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
