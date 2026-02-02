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
  FORM_SENT: "Form Sent",
  FORM_SIGNED: "Form Signed",
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
  FORM_SENT: "Form",
  FORM_SIGNED: "Form",
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
  FORM_SENT: "info",
  FORM_SIGNED: "success",
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
