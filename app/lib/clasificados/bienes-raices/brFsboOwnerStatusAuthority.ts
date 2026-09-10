/**
 * Gate BIENES-PRIVADO-1 — the pure transition rules for an owner status change on a Bienes Raíces
 * FSBO (Privado) listing. Zero imports, zero I/O, deliberately mirroring
 * `brListingLifecycleEligibility.ts`'s shape so both BR lanes speak one vocabulary.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────
 * Gate Zero traced the owner dashboard's `markStatus(id, "active" | "sold")` on all three surfaces
 * (`mis-anuncios`, `mis-anuncios/[id]`, `mis-anuncios/[id]/editar`). For a Negocio row, "mark sold"
 * already routes to the server (`applyBrLifecycleMutation`). For a PRIVADO row every call went
 * straight to `applyOwnerListingPatch` — an RLS-scoped `update … .eq(id).eq(owner_id)` with NO
 * from-status validation at all. The owner is legitimately authorized to write their own row, so
 * RLS is satisfied; what was missing was any rule about WHICH transition is legal.
 *
 * The consequence was not theoretical. `markStatus("active")` writes `status: "active"` and
 * `is_published: true` unconditionally, and an unpaid FSBO row sits at `status: "pending"` waiting
 * for the Revenue OS webhook. So a pending, never-paid listing could be pushed live from the
 * dashboard — and because that row has no `expires_at`, the new fixed-term rule fails open on it
 * and it would stay live indefinitely. Payment authority belongs to the webhook, and only the
 * webhook; this module is how the owner surfaces stop being able to bypass it.
 *
 * ── WHY NOT REUSE THE NEGOCIO SERVICE ────────────────────────────────────────────────────────
 * `applyBrLifecycleMutation` is not a general BR lifecycle engine — it is the NEGOCIO model. It
 * requires `seller_type === "business"` (it rejects anything else with `listing_not_eligible`),
 * resolves parent/child inventory relationships, cascades pause to canonical children, and routes
 * activation through the `br_negocio_activate_listing` capacity RPC. A private seller has no
 * parent, no children, no inventory capacity and no subscription. Forcing Privado through it would
 * mean either inventing a fake business identity or gutting the Negocio guarantees — so, per this
 * gate's instruction, Privado keeps its own rules. The models genuinely differ.
 *
 * What is shared is the DOCTRINE, restated here for a flat listing: a transition is legal only from
 * an explicitly enumerated prior state, the rule is server-owned, and it fails closed.
 */

export const BR_FSBO_OWNER_STATUS_ACTIONS = ["mark_sold", "relist", "pause", "resume", "archive"] as const;
export type BrFsboOwnerStatusAction = (typeof BR_FSBO_OWNER_STATUS_ACTIONS)[number];

export const BR_FSBO_STATUS_AUTH_REQUIRED_ERROR = "br_fsbo_status_auth_required" as const;
export const BR_FSBO_STATUS_LISTING_NOT_FOUND_ERROR = "br_fsbo_status_listing_not_found" as const;
export const BR_FSBO_STATUS_OWNER_MISMATCH_ERROR = "br_fsbo_status_owner_mismatch" as const;
/** The row is not a private-seller BR row — e.g. a Negocio row, which has its own service. */
export const BR_FSBO_STATUS_LANE_MISMATCH_ERROR = "br_fsbo_status_lane_mismatch" as const;
export const BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR = "br_fsbo_status_transition_not_allowed" as const;
/** The listing has never been paid for; only the Revenue OS webhook may publish it. */
export const BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR = "br_fsbo_status_payment_required" as const;
export const BR_FSBO_STATUS_SERVICE_UNAVAILABLE_ERROR = "supabase_not_configured" as const;

export type BrFsboStatusErrorCode =
  | typeof BR_FSBO_STATUS_AUTH_REQUIRED_ERROR
  | typeof BR_FSBO_STATUS_LISTING_NOT_FOUND_ERROR
  | typeof BR_FSBO_STATUS_OWNER_MISMATCH_ERROR
  | typeof BR_FSBO_STATUS_LANE_MISMATCH_ERROR
  | typeof BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR
  | typeof BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR
  | typeof BR_FSBO_STATUS_SERVICE_UNAVAILABLE_ERROR;

export type BrFsboStatusRow = {
  status?: string | null;
  is_published?: boolean | null;
};

/**
 * Statuses that mean "this listing was never activated by a paid webhook". Publishing out of one of
 * these is a payment bypass, not a lifecycle transition — hence its own error code.
 */
export const BR_FSBO_UNPAID_STATUSES = ["pending", "pending_payment", "draft"] as const;

/** Moderation states no owner action may escape. Only Admin/moderation can leave these. */
export const BR_FSBO_MODERATED_STATUSES = ["removed", "flagged", "suspended"] as const;

function norm(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function isActiveAndPublished(row: BrFsboStatusRow): boolean {
  return norm(row.status) === "active" && row.is_published !== false;
}

export type BrFsboStatusDecision =
  | { ok: true; patch: { status: string; is_published: boolean }; fromStatuses: readonly string[] }
  | { ok: false; error: BrFsboStatusErrorCode };

/**
 * THE transition rule. Given the row's REAL current state (read server-side, never client-supplied)
 * and the requested action, return either the exact patch to apply or a typed refusal.
 *
 * Every rule is an allow-list of prior states — an unrecognized or unexpected status can only ever
 * fall through to `transition_not_allowed`.
 *
 * Note what is deliberately absent: no action here writes, clears or extends `expires_at`. A term
 * is bought, not toggled. Relisting a listing whose 45 days have already elapsed restores
 * `status: "active"` but the row stays publicly hidden by `isBrFsboRowWithinTerm` until the owner
 * buys a renewal — which is the honest outcome, and the reason this module does not need to know
 * about expiry at all.
 */
export function resolveBrFsboOwnerStatusDecision(input: {
  row: BrFsboStatusRow;
  action: BrFsboOwnerStatusAction;
}): BrFsboStatusDecision {
  const status = norm(input.row.status);

  if ((BR_FSBO_MODERATED_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
  }

  switch (input.action) {
    case "mark_sold":
      // Only a listing that is genuinely live can be sold. A pending row has nothing to sell yet.
      if (!isActiveAndPublished(input.row)) {
        return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
      }
      return { ok: true, patch: { status: "sold", is_published: false }, fromStatuses: ["active"] };

    case "relist":
      // THE payment-bypass fix. Relist means "this previously-published listing goes back up", and
      // the only prior state that proves prior publication is `sold`. An unpaid row is refused with
      // a distinct code so the owner is told to complete payment rather than "try again later".
      if ((BR_FSBO_UNPAID_STATUSES as readonly string[]).includes(status)) {
        return { ok: false, error: BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR };
      }
      if (status !== "sold") {
        return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
      }
      return { ok: true, patch: { status: "active", is_published: true }, fromStatuses: ["sold"] };

    case "pause":
      if (!isActiveAndPublished(input.row)) {
        return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
      }
      return { ok: true, patch: { status: "paused", is_published: false }, fromStatuses: ["active"] };

    case "resume":
      // Same bypass guard: resuming is only ever from a real `paused` state, never from unpaid.
      if ((BR_FSBO_UNPAID_STATUSES as readonly string[]).includes(status)) {
        return { ok: false, error: BR_FSBO_STATUS_PAYMENT_REQUIRED_ERROR };
      }
      if (status !== "paused") {
        return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
      }
      return { ok: true, patch: { status: "active", is_published: true }, fromStatuses: ["paused"] };

    case "archive":
      // Archiving is always permitted except out of a moderation state (handled above). It never
      // deletes: the row, its media, its analytics and its leonix_ad_id all survive.
      return {
        ok: true,
        patch: { status: "removed", is_published: false },
        fromStatuses: ["active", "paused", "sold", "pending", "pending_payment", "draft"],
      };

    default:
      return { ok: false, error: BR_FSBO_STATUS_TRANSITION_NOT_ALLOWED_ERROR };
  }
}

export function isBrFsboOwnerStatusAction(value: unknown): value is BrFsboOwnerStatusAction {
  return typeof value === "string" && (BR_FSBO_OWNER_STATUS_ACTIONS as readonly string[]).includes(value);
}
