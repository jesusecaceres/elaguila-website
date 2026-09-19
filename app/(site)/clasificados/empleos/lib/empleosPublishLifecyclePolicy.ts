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

const EMPLEOS_PUBLISH_LANES = new Set(["quick", "premium", "feria"]);

export type EmpleosEnvelopeLaneDecision =
  | { ok: true; lane: "quick" | "premium" | "feria" }
  | { ok: false; error: "invalid_envelope" | "invalid_lane" | "lane_payload_mismatch" | "invalid_feria_payload" };

function nonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * D13 / F1 (2026-09 final paid/free circuit audit): the ONE authoritative lane of a publish envelope.
 *
 * The payment decision (`resolveEmpleosUpsertLifecycle`) used to read the TOP-LEVEL `envelope.lane` while the job
 * record / listing content is built from `envelope.payload.lane`, so a logged-in user could send
 * `lane:"feria"` (free) with a quick / premium payload and publish a paid job post with no payment.
 * The lane is now derived from `payload.lane` ONLY (the field the content is built from); a declared
 * `envelope.lane` that disagrees is refused (`lane_payload_mismatch`), and a free (feria) publish must carry a
 * real feria payload (title, date, venue, organizer + the arrays the mapper reads), never a paid-lane one.
 */
export function resolveEmpleosEnvelopeLane(
  envelope: { lane?: unknown; payload?: unknown } | null | undefined,
  mode: "draft" | "publish",
): EmpleosEnvelopeLaneDecision {
  const payload = envelope?.payload as { lane?: unknown; data?: unknown } | null | undefined;
  if (!payload || typeof payload !== "object") return { ok: false, error: "invalid_envelope" };
  const payloadLane = String(payload.lane ?? "").trim().toLowerCase();
  if (!EMPLEOS_PUBLISH_LANES.has(payloadLane)) return { ok: false, error: "invalid_lane" };
  const declared = String(envelope?.lane ?? "").trim().toLowerCase();
  if (declared !== payloadLane) return { ok: false, error: "lane_payload_mismatch" };
  const data = payload.data as Record<string, unknown> | null | undefined;
  if (!data || typeof data !== "object" || !nonEmptyString(data.title)) return { ok: false, error: "invalid_envelope" };
  if (payloadLane === "feria") {
    const shapeOk =
      Array.isArray(data.detailsBullets) &&
      Array.isArray(data.secondaryDetails) &&
      typeof data.venue === "string" &&
      typeof data.dateLine === "string";
    if (!shapeOk) return { ok: false, error: "invalid_feria_payload" };
    if (mode === "publish" && !(nonEmptyString(data.dateLine) && nonEmptyString(data.venue) && nonEmptyString(data.organizer))) {
      return { ok: false, error: "invalid_feria_payload" };
    }
  }
  return { ok: true, lane: payloadLane as "quick" | "premium" | "feria" };
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

  if (input.hasStaffReason && (current === "paused" || current === "pending_review" || current === "rejected" || current === "archived")) {
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
