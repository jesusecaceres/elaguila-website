export const LEONIX_LEAD_STATUSES = ["new", "contacted", "qualified", "closed", "archived"] as const;

export type LeonixLeadStatus = (typeof LEONIX_LEAD_STATUSES)[number];
