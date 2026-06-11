/** Leonix admin lead pipeline statuses (LEADS-CRM-01). */
export const LEONIX_LEAD_STATUSES = [
  "new",
  "needs_reply",
  "contacted",
  "waiting_on_client",
  "qualified",
  "won",
  "lost",
  "archived",
] as const;

export type LeonixLeadStatus = (typeof LEONIX_LEAD_STATUSES)[number];

/** Legacy DB values still readable in UI until migration runs. */
export const LEONIX_LEAD_STATUS_LEGACY_MAP: Record<string, LeonixLeadStatus> = {
  closed: "won",
};

export function normalizeLeadStatus(raw: string): string {
  const v = raw.trim().toLowerCase();
  return LEONIX_LEAD_STATUS_LEGACY_MAP[v] ?? v;
}
