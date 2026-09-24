/**
 * Empleos publication lifecycle policy — PURE (no I/O), so the rules are testable and shared by the
 * envelope writer and the owner PATCH route.
 *
 * Why this exists (2026-09-18 publication-circuit audit, proven in source):
 *  - `PATCH /api/clasificados/empleos/listings/[id]` let an owner set `published` on ANY of their own
 *    rows: a paid job post that never paid, or a row staff rejected / paused for moderation.
 *  - `POST /api/clasificados/empleos/listings` with `mode:"publish"` had no lane or payment gate and
 *    overwrote `rejected` / `archived` rows straight to `published`.
 *  - `mode:"draft"` on an already-published row demoted it to `draft`.
 * Payment truth for the paid lanes (quick, premium) is applied ONLY by the verified Revenue OS
 * webhook (`activatePaidEmpleosListingFromRevenueOs`: draft → published). The free lane (feria) has
 * no payment, so its owner may publish.
 */

export type EmpleosPolicyLifecycle =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived"
  | "rejected";

/** Lanes that need no payment. Everything else (quick, premium, unknown) is treated as paid. */
const FREE_LANES = new Set(["feria"]);

export function isEmpleosFreeLane(lane: string | null | undefined): boolean {
  return FREE_LANES.has(String(lane ?? "").trim().toLowerCase());
}

export type EmpleosUpsertDecision =
  | { ok: true; lifecycle: EmpleosPolicyLifecycle }
  | { ok: false; error: "payment_required" | "not_publishable" };

/**
 * Envelope save (`POST /api/clasificados/empleos/listings`).
 *  - draft mode never demotes an existing row: a published/paused/pending_review/rejected/archived row
 *    keeps its status while content is updated; a new or draft row stays `draft`.
 *  - publish mode: paid lanes cannot publish through this route (payment activates them) unless the
 *    row is already published (an edit save); `rejected`/`archived` rows are never re-published here;
 *    a staff-held row (`pending_review`, or `paused`) keeps its status.
 */
export function resolveEmpleosUpsertLifecycle(input: {
  mode: "draft" | "publish";
  lane: string | null | undefined;
  existingStatus: string | null | undefined;
  requireReview: boolean;
}): EmpleosUpsertDecision {
  const existing = String(input.existingStatus ?? "").trim().toLowerCase();

  if (input.mode === "draft") {
    if (
      existing === "published" ||
      existing === "paused" ||
      existing === "pending_review" ||
      existing === "rejected" ||
      existing === "archived"
    ) {
      return { ok: true, lifecycle: existing };
    }
    return { ok: true, lifecycle: "draft" };
  }

  if (existing === "rejected" || existing === "archived") return { ok: false, error: "not_publishable" };
  if (existing === "published" || existing === "paused" || existing === "pending_review") {
    return { ok: true, lifecycle: existing };
  }
  if (!isEmpleosFreeLane(input.lane)) return { ok: false, error: "payment_required" };
  return { ok: true, lifecycle: input.requireReview ? "pending_review" : "published" };
}

export type EmpleosRowOwnerDecision = { ok: true; ownerUserId: string | null } | { ok: false; error: "forbidden" };

/**
 * Owner of the row after an envelope save (`upsertEmpleosListingFromEnvelope`).
 *
 * Customer/owner saves (`assistedCustody` false): unchanged strict rule — the incoming owner must equal the
 * stored owner, and an owner-null row can never be claimed.
 *
 * Staff assisted saves (`assistedCustody` true — ONLY set by a route that already re-proved the custody
 * ledger for the signed-context row): a reopen must be able to update the bound row whichever way the
 * owner attribution drifted between saves.
 *  - stored owner-null, incoming client: the client is adopted as owner (client appeared after first save).
 *  - stored owner X, incoming null: X is KEPT (a staff save with no client never strips or demotes ownership).
 *  - stored owner X, incoming Y (different): still forbidden — custody never moves a row between customers.
 */
export function resolveEmpleosRowOwner(input: {
  existingOwner: string | null | undefined;
  incomingOwner: string | null | undefined;
  assistedCustody: boolean;
}): EmpleosRowOwnerDecision {
  const existing = String(input.existingOwner ?? "").trim() || null;
  const incoming = String(input.incomingOwner ?? "").trim() || null;
  if (input.assistedCustody) {
    if (existing && incoming && existing !== incoming) return { ok: false, error: "forbidden" };
    return { ok: true, ownerUserId: incoming ?? existing };
  }
  if (existing && existing !== incoming) return { ok: false, error: "forbidden" };
  if (!existing && incoming) return { ok: false, error: "forbidden" };
  return { ok: true, ownerUserId: incoming };
}

export type EmpleosOwnerTransitionDecision =
  | { ok: true }
  | { ok: false; error: "payment_required" | "forbidden_transition" | "staff_hold" };

/**
 * Owner lifecycle PATCH. Owners may pause, resume their own pause, archive, and (free lane only)
 * publish a draft. They may never publish a paid draft, resume a staff-held row, or reopen a
 * rejected / archived row.
 */
export function resolveEmpleosOwnerTransition(input: {
  lane: string | null | undefined;
  current: string | null | undefined;
  next: string;
  /** `moderation_reason` present on the row = a staff decision is attached to the current status. */
  hasStaffReason: boolean;
  /** The row has a `published_at` — it went live through a legitimate path at least once. */
  everPublished?: boolean;
}): EmpleosOwnerTransitionDecision {
  const current = String(input.current ?? "").trim().toLowerCase();
  const next = String(input.next ?? "").trim().toLowerCase();
  if (current === next) return { ok: true };

  if (input.hasStaffReason && (current === "paused" || current === "pending_review" || current === "rejected")) {
    return next === "archived" ? { ok: true } : { ok: false, error: "staff_hold" };
  }

  switch (current) {
    case "published":
      return next === "paused" || next === "archived" ? { ok: true } : { ok: false, error: "forbidden_transition" };
    case "paused":
      return next === "published" || next === "archived" ? { ok: true } : { ok: false, error: "forbidden_transition" };
    case "draft":
      if (next === "archived") return { ok: true };
      if (next === "published") return isEmpleosFreeLane(input.lane) ? { ok: true } : { ok: false, error: "payment_required" };
      return { ok: false, error: "forbidden_transition" };
    case "archived":
      // The dashboard's "reopen" for a post the owner archived after it had gone live. A row that
      // never went live (never paid / never approved) cannot be opened by archiving it first.
      if (next === "published" && input.everPublished) return { ok: true };
      return { ok: false, error: next === "published" && !isEmpleosFreeLane(input.lane) ? "payment_required" : "forbidden_transition" };
    case "pending_review":
    case "rejected":
      return next === "archived" ? { ok: true } : { ok: false, error: "forbidden_transition" };
    default:
      return { ok: false, error: "forbidden_transition" };
  }
}
