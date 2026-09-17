/**
 * Gate RENTAS-NEGOCIO-1 — the permanent boundary around fixed-term activation.
 *
 * ── THE DEFECT THIS CLOSES ───────────────────────────────────────────────────────────────────
 * `public.listings` is shared by categories with two incompatible commercial models:
 *
 *   - SUBSCRIPTION lanes (Bienes Raíces Negocio, …) — no `expires_at`; visibility follows the
 *     subscription record.
 *   - FIXED-TERM lanes (Rentas $24.99/30d, Bienes Raíces FSBO $49.99/45d) — the row MUST carry a
 *     real `listings.expires_at`, written by that lane's own Revenue OS fulfillment, or the paid
 *     term is unenforceable and the listing stays publicly live forever.
 *
 * `brListingPaymentService.tryActivateBrListingAfterPayment` has a generic tail branch that flips
 * ANY `listings` row to `status: "active", is_published: true` — and it does not, and structurally
 * cannot, write `expires_at`. It has no access to the category's package key, duration, payment
 * record, or renewal state. For a fixed-term row that branch is not "activation with a missing
 * field"; it is activation that destroys the product.
 *
 * The Rentas Gate Zero MRI proved this reachable: `/api/clasificados/leonix/stripe/checkout/verify`
 * accepts any paid Stripe `session_id`, reads `listing_id` from its metadata, and calls that
 * service — with none of the category or Revenue-OS-session guards its sibling webhook carries.
 *
 * ── WHY THE GUARD LIVES HERE AND NOT ONLY AT THE ROUTE ───────────────────────────────────────
 * Guarding only the route would leave the hazard one new caller away. This module states the rule
 * once, in lifecycle terms, so any present or future generic activation path fails CLOSED against
 * it. The route gets its own guards too (defence in depth), but this is the boundary that holds.
 *
 * Refusing here breaks nothing legitimate. Every fixed-term lane already has its own dedicated,
 * term-writing fulfillment and never reaches the generic branch:
 *   - Rentas            → `activatePaidRentasListingFromRevenueOs`   (writes expires_at)
 *   - Bienes FSBO       → `activatePaidBienesFsboListingFromRevenueOs` (writes expires_at)
 * and every subscription lane is unaffected:
 *   - Bienes Negocio    → the capacity RPC branch above the generic tail
 *
 * Pure: no I/O, no framework imports.
 */
import { isBrFsboRow } from "./bienesFsboLifecycle";

/** The minimum row shape the rule evaluates. Every field optional — callers project narrowly. */
export type FixedTermActivationRowLike = {
  category?: string | null;
  seller_type?: string | null;
  listing_json?: unknown;
};

export const FIXED_TERM_ACTIVATION_BLOCKED_ERROR = "fixed_term_activation_requires_category_fulfillment" as const;

export type FixedTermActivationVerdict =
  | { required: false }
  | {
      required: true;
      /** Machine reason, safe to log. Never returned raw to a public client. */
      code: typeof FIXED_TERM_ACTIVATION_BLOCKED_ERROR;
      /** The lane that was recognised, for audit/log clarity. */
      lane: "rentas" | "bienes-raices-fsbo";
      /** The ONLY function permitted to activate this lane. */
      canonicalFulfillment: string;
    };

function norm(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * THE rule. `required: true` means "this row carries a paid fixed term, and the caller asking is
 * not the lane's own term-writing fulfillment — refuse rather than publish a listing whose term can
 * never be enforced."
 *
 * Deliberately narrow: it recognises only the two lanes that genuinely persist a term today. A
 * subscription row, an unmodelled category, or an unreadable row all return `required: false`, so
 * this guard can never block an activation it does not positively understand.
 */
export function requiresCanonicalTermOnActivation(
  row: FixedTermActivationRowLike,
): FixedTermActivationVerdict {
  const category = norm(row.category);

  if (category === "rentas") {
    // Both Rentas lanes (privado and negocio) are the same one-time `rentas_30d` product. There is
    // no Rentas subscription, so category alone is sufficient and no lane check is needed.
    return {
      required: true,
      code: FIXED_TERM_ACTIVATION_BLOCKED_ERROR,
      lane: "rentas",
      canonicalFulfillment: "activatePaidRentasListingFromRevenueOs",
    };
  }

  if (category === "bienes-raices" && isBrFsboRow(row)) {
    // Bienes Raíces holds BOTH models, so this must be lane-scoped: only FSBO carries a term.
    // A Negocio row is a monthly subscription and must remain activatable by its own path.
    return {
      required: true,
      code: FIXED_TERM_ACTIVATION_BLOCKED_ERROR,
      lane: "bienes-raices-fsbo",
      canonicalFulfillment: "activatePaidBienesFsboListingFromRevenueOs",
    };
  }

  return { required: false };
}
