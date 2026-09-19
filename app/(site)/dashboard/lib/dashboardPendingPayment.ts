/**
 * CLOSEOUT 2 (2026-09) — owner-dashboard "awaiting payment" truth + Revenue OS resume-payment payloads.
 *
 * Pure, zero-I/O. Answers three questions for the owner dashboards (Mis anuncios, Empleos, Restaurantes,
 * Autos):
 *   1. Is this row an UNPAID, NOT-LIVE listing?  (=> truthful "Payment pending" status, no public
 *      "View listing" link, no public-page "Preview")
 *   2. Is a base Revenue OS checkout legitimately startable for it from the dashboard?  The predicates
 *      below mirror EXACTLY the pre-payment guard `app/api/revenue-os/checkout/route.ts` (d3ed73ab)
 *      enforces server-side, so the client never offers an action the server will refuse:
 *        - Rentas / BR FSBO / Clases paid : owned `listings` row, status `pending`, is_published !== true
 *        - Empleos (quick / premium)      : owned `draft`
 *        - Autos Privado                  : draft | pending_payment | payment_failed
 *   3. What is the payload?  ONLY the pre-existing payload constants from `revenueCategoryCheckoutPayload.ts`
 *      (the same objects each category's own Preview client spreads) — no new package key, price or route.
 *
 * Restaurantes / Servicios / Comida Local base plans are monthly SUBSCRIPTIONS that hard-require the
 * recurring-billing consent captured by the shared checkout checkpoint, so the dashboard never starts
 * their checkout directly: it resumes into the category's own checkpoint page instead
 * (`isRestauranteAwaitingPayment` only drives the status/CTA gating).
 */
import {
  AUTOS_PRIVADO_CHECKOUT,
  BIENES_RAICES_FSBO_CHECKOUT,
  CLASES_CATEGORY_CHECKOUT,
  EMPLEOS_PAID_JOB_CHECKOUT,
  RENTAS_CATEGORY_CHECKOUT,
  type RevenueCategoryCheckoutPayload,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";

export type DashboardPendingPaymentLane =
  | "empleos"
  | "rentas"
  | "bienes-raices-fsbo"
  | "clases"
  | "autos-privado";

type Lang = "es" | "en";

// ── copy ────────────────────────────────────────────────────────────────────────────────────────

export function dashboardAwaitingPaymentLabel(lang: Lang): string {
  return lang === "es" ? "Pago pendiente" : "Payment pending";
}

export function dashboardCompletePaymentLabel(lang: Lang): string {
  return lang === "es" ? "Completar pago" : "Complete payment";
}

export function dashboardStartingPaymentLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export function dashboardNotLiveNote(lang: Lang): string {
  return lang === "es"
    ? "Aún no está publicado: se publica cuando se confirma el pago. Puedes editarlo o completar el pago."
    : "Not published yet: it goes live once payment is confirmed. You can edit it or complete payment.";
}

// ── generic status truth ─────────────────────────────────────────────────────────────────────────

const PRE_PUBLICATION_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "pending_payment",
  "pending_review",
  "payment_failed",
  "draft",
  "preview_ready",
  "publish_ready",
]);

/** True for any status that means "created but never (yet) public" — never offer a public "view" link. */
export function isPrePublicationStatus(status: string | null | undefined): boolean {
  return PRE_PUBLICATION_STATUSES.has(String(status ?? "").trim().toLowerCase());
}

/**
 * Is the dedicated-table inventory row actually on the public site right now?
 * `isPublic` only matters for Viajes (approved AND is_public). Unknown category => true (never hides a
 * link this helper has no evidence about).
 */
export function dashboardInventoryRowIsPubliclyLive(input: {
  category: string;
  status: string | null | undefined;
  isPublic?: boolean | null;
}): boolean {
  const cat = String(input.category ?? "").trim().toLowerCase();
  const st = String(input.status ?? "").trim().toLowerCase();
  if (cat === "restaurantes" || cat === "servicios" || cat === "empleos") return st === "published";
  if (cat === "autos_paid" || cat === "autos") return st === "active";
  if (cat === "viajes") return st === "approved" && input.isPublic === true;
  return true;
}

// ── eligibility (mirrors the server pre-flight) ─────────────────────────────────────────────────

/** Empleos: only the paid lanes (quick / premium) have a payment; Feria is free. Server accepts only `draft`. */
export function isEmpleosDraftAwaitingPayment(row: {
  lane?: string | null;
  lifecycle_status?: string | null;
}): boolean {
  const lane = String(row.lane ?? "").trim().toLowerCase();
  const st = String(row.lifecycle_status ?? "").trim().toLowerCase();
  return (lane === "quick" || lane === "premium") && st === "draft";
}

/** Restaurantes: hidden pre-checkout save (`restaurantes_public_listings.status = 'pending_payment'`). */
export function isRestauranteAwaitingPayment(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === "pending_payment";
}

/** Autos Privado (`autos_classifieds_listings`): the server pre-flight accepts exactly these three. */
export const AUTOS_PRIVADO_PAYABLE_DASHBOARD_STATUSES: readonly string[] = ["draft", "pending_payment", "payment_failed"];

export function isAutosPrivadoAwaitingPayment(row: {
  lane?: string | null;
  status?: string | null;
}): boolean {
  return (
    String(row.lane ?? "").trim().toLowerCase() === "privado" &&
    AUTOS_PRIVADO_PAYABLE_DASHBOARD_STATUSES.includes(String(row.status ?? "").trim().toLowerCase())
  );
}

function readDetailPair(detailPairs: unknown, key: string): string | null {
  if (!Array.isArray(detailPairs)) return null;
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const rec = p as Record<string, unknown>;
    if (String(rec.label ?? rec.key ?? "").trim() !== key) continue;
    const v = rec.value;
    return typeof v === "string" && v.trim() ? v.trim() : null;
  }
  return null;
}

export type SharedListingsPaymentRow = {
  category?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  detail_pairs?: unknown;
  /** Branch already parsed by the caller (`parseLeonixListingContract(detail_pairs).branch`). */
  branch?: string | null;
};

/**
 * Shared `listings` table paid lanes. Returns the lane whose Revenue OS base package can be started for
 * this row, or null. `pending` + not published is the ONLY state the server accepts.
 *   - rentas (privado AND negocio)  -> rentas_30d   (both Rentas preview clients use RENTAS_CATEGORY_CHECKOUT)
 *   - bienes-raices FSBO / privado  -> br_fsbo_45d   (Negocio is a subscription with consent: NEVER here)
 *   - clases WITH classCostType=pagada -> clases_paid_30d (a free / pending-review class is never charged)
 */
export function resolveSharedListingPaymentLane(
  row: SharedListingsPaymentRow,
): "rentas" | "bienes-raices-fsbo" | "clases" | null {
  if (String(row.status ?? "").trim().toLowerCase() !== "pending") return null;
  if (row.is_published === true) return null;
  const cat = String(row.category ?? "").trim().toLowerCase();
  if (cat === "rentas") return "rentas";
  if (cat === "bienes-raices") {
    const branch = row.branch ?? readDetailPair(row.detail_pairs, "Leonix:branch");
    return branch === "bienes_raices_privado" ? "bienes-raices-fsbo" : null;
  }
  if (cat === "clases") {
    return readDetailPair(row.detail_pairs, "Leonix:classCostType") === "pagada" ? "clases" : null;
  }
  return null;
}

/** `listings` row that is unpaid and not live (any lane) — drives the truthful status + no public link. */
export function isSharedListingsRowNotLive(row: {
  status?: string | null;
  is_published?: boolean | null;
}): boolean {
  return isPrePublicationStatus(row.status) && row.is_published !== true;
}

// ── payloads (existing constants only) ──────────────────────────────────────────────────────────

const LANE_PAYLOAD: Record<DashboardPendingPaymentLane, Pick<RevenueCategoryCheckoutPayload, "category" | "packageKey" | "returnPath">> = {
  empleos: EMPLEOS_PAID_JOB_CHECKOUT,
  rentas: RENTAS_CATEGORY_CHECKOUT,
  "bienes-raices-fsbo": BIENES_RAICES_FSBO_CHECKOUT,
  clases: CLASES_CATEGORY_CHECKOUT,
  "autos-privado": AUTOS_PRIVADO_CHECKOUT,
};

/** Where the owner lands after Stripe (success or cancel): back on the owner's own dashboard tab. */
export function dashboardPendingPaymentReturnPath(lane: DashboardPendingPaymentLane, lang: Lang): string {
  if (lane === "empleos") return `/dashboard/empleos?lang=${lang}`;
  const tab =
    lane === "rentas" ? "rentas" : lane === "bienes-raices-fsbo" ? "bienes-raices" : lane === "clases" ? "clases" : "autos";
  return `/dashboard/mis-anuncios?lang=${lang}&cat=${tab}`;
}

/**
 * The exact Revenue OS payload for a dashboard resume-payment. `listingId` is the listing row's own id
 * (the same value each category's Preview client passes after its pre-checkout save). Never adds an
 * add-on, promo, price or package key of its own.
 */
export function buildDashboardResumePaymentPayload(input: {
  lane: DashboardPendingPaymentLane;
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
}): RevenueCategoryCheckoutPayload {
  const base = LANE_PAYLOAD[input.lane];
  return {
    category: base.category,
    packageKey: base.packageKey,
    listingId: input.listingId.trim(),
    leonixAdId: input.leonixAdId?.trim() || null,
    locale: input.lang,
    returnPath: dashboardPendingPaymentReturnPath(input.lane, input.lang),
  };
}

// ── Restaurantes resume-payment routing (subscription => must pass through the consent checkpoint) ──

/** Category draft-preview page that hosts the shared checkout checkpoint (recurring consent + Pay). */
export function restauranteResumePaymentPreviewHref(lang: Lang, anchor: "preview" | "checkout"): string {
  const base = `/clasificados/restaurantes/preview?lang=${lang}`;
  return anchor === "checkout" ? `${base}#publish-checkout-checkpoint` : base;
}
