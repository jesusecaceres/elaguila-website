/** Shared admin classified queue action proof + scroll restore (Phase 15). */

export const ADMIN_QUEUE_ACTION_PARAMS = [
  "action_status",
  "action",
  "target",
  "target_label",
  "target_ad_id",
  "scroll_y",
  "action_error",
] as const;

export type AdminQueueActionStatus = "success" | "error";

export type AdminActionResultParams = {
  status: AdminQueueActionStatus;
  action: string;
  target: string;
  targetLabel: string;
  targetAdId: string;
  scrollY: number;
  error: string;
};

const ACTION_PAST_TENSE: Record<string, string> = {
  archive: "Archived",
  suspend: "Suspended",
  unsuspend: "Restored",
  promote_on: "Featured",
  promote_off: "Removed featured",
  verify_on: "Verified",
  verify_off: "Removed verified",
  republish: "Republished",
  delete: "Deleted",
  hide_public: "Hidden",
  show_public: "Published",
};

function truncateLabel(s: string, max = 72): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function adminQueueRowAnchorId(internalId: string): string {
  return `row-${internalId}`;
}

/** Visible zebra + hover; highlight applied separately when needed. */
export const adminQueueTableZebra =
  "border-b border-[#E8DFD0]/70 odd:bg-[#FFFCF7] even:bg-[#F8F0E3] hover:bg-[#F3E6D2]";

export function adminQueueRowHighlightClass(highlighted: boolean): string {
  return highlighted ? "bg-[#FFF3CD] ring-1 ring-inset ring-[#C9B46A]" : "";
}

export function adminQueueRowClass(highlighted: boolean): string {
  if (highlighted) {
    return `${adminQueueRowHighlightClass(true)} border-b border-[#E8DFD0]/70 hover:bg-[#F3E6D2]`;
  }
  return adminQueueTableZebra;
}

export function stripAdminQueueActionParams(params: URLSearchParams): void {
  for (const key of ADMIN_QUEUE_ACTION_PARAMS) {
    params.delete(key);
  }
}

export function recordToUrlSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === "string") params.set(key, val);
    else if (Array.isArray(val) && val[0]) params.set(key, String(val[0]));
  }
  return params;
}

export function parseAdminActionResultFromRecord(
  sp: Record<string, string | string[] | undefined>,
): AdminActionResultParams | null {
  return parseAdminActionResultParams(recordToUrlSearchParams(sp));
}

export function parseAdminActionResultParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): AdminActionResultParams | null {
  const get = (key: string): string => {
    if (searchParams instanceof URLSearchParams) {
      return (searchParams.get(key) ?? "").trim();
    }
    const v = searchParams[key];
    if (typeof v === "string") return v.trim();
    if (Array.isArray(v) && v[0]) return String(v[0]).trim();
    return "";
  };

  const statusRaw = get("action_status");
  if (statusRaw !== "success" && statusRaw !== "error") return null;

  const action = get("action");
  const target = get("target");
  if (!action || !target) return null;

  const scrollRaw = get("scroll_y");
  const scrollY = scrollRaw ? Math.max(0, parseInt(scrollRaw, 10) || 0) : 0;

  return {
    status: statusRaw,
    action,
    target,
    targetLabel: get("target_label"),
    targetAdId: get("target_ad_id"),
    scrollY,
    error: get("action_error"),
  };
}

export function formatAdminActionProofMessage(params: AdminActionResultParams): string {
  const verb = ACTION_PAST_TENSE[params.action] ?? params.action;
  const idPart = params.targetAdId.trim() || params.target.slice(0, 8) + "…";
  const labelPart = params.targetLabel.trim() ? ` — ${truncateLabel(params.targetLabel)}` : "";

  if (params.status === "error") {
    const err = params.error.trim() || "Unknown error";
    return `Failed to ${verb.toLowerCase()} ${idPart}: ${err}`;
  }

  return `${verb} ${idPart}${labelPart}`;
}

export type BuildAdminActionReturnUrlInput = {
  returnTo: string;
  action_status: AdminQueueActionStatus;
  action: string;
  target: string;
  target_label?: string | null;
  target_ad_id?: string | null;
  scroll_y?: number;
  action_error?: string | null;
  /** Custom proof label for republish (Move to top / Republish / …). */
  proof_action?: string | null;
};

export function buildAdminActionReturnUrl(input: BuildAdminActionReturnUrlInput): string {
  const [path, query = ""] = input.returnTo.split("?");
  const params = new URLSearchParams(query);
  stripAdminQueueActionParams(params);

  params.set("action_status", input.action_status);
  params.set("action", input.proof_action?.trim() || input.action);
  params.set("target", input.target);
  if (input.target_label?.trim()) {
    params.set("target_label", input.target_label.trim().slice(0, 120));
  }
  if (input.target_ad_id?.trim()) {
    params.set("target_ad_id", input.target_ad_id.trim().slice(0, 64));
  }
  if (typeof input.scroll_y === "number" && input.scroll_y >= 0) {
    params.set("scroll_y", String(Math.round(input.scroll_y)));
  }
  if (input.action_status === "error" && input.action_error?.trim()) {
    params.set("action_error", input.action_error.trim().slice(0, 200));
  }

  const qs = params.toString();
  const hash = `#${adminQueueRowAnchorId(input.target)}`;
  return qs ? `${path}?${qs}${hash}` : `${path}${hash}`;
}

/** Default row cap for admin classified queues (Phase 15 perf). */
export const ADMIN_QUEUE_DEFAULT_LIMIT = 100;

export function normalizeAdminQueueLimit(raw: number | string | undefined, fallback = ADMIN_QUEUE_DEFAULT_LIMIT): number {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), 50), 500);
}
