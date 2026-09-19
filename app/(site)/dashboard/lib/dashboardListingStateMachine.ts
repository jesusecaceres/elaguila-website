/**
 * DASHBOARD OWNER STATE MACHINE (2026-09 Gate 2) - PURE (no I/O, no React, no Supabase, client-safe).
 *
 * DOCTRINE: payment truth != entitlement != listing lifecycle != public visibility != moderation.
 * The owner dashboard must never invent a public state from a raw `status` string. This module is the ONE place
 * that answers, per category and per row:
 *
 *   - `live`          the row is on the public RESULTS surface (the very predicate Admin Live uses -
 *                     `app/admin/_lib/adminLivePredicates.ts`), so "Active / Published / Public" chips and
 *                     owner "active" counts agree with Admin and with the public readers;
 *   - `linkResolves`  a public DETAIL link would resolve (a superset of `live` only where the public detail page
 *                     documents a direct-URL state, i.e. `sold` En Venta / Bienes Raices). "View public" is offered
 *                     iff this is true - never a link that 404s;
 *   - `termElapsed`   a paid / fixed term ran out while `status` still says `active` (Rentas, FSBO, Clases paid,
 *                     Autos Privado): the row is EXPIRED for the owner even though the column never changed;
 *   - the action plan (Edit / Preview / Complete payment / Pause / Resume / Archive / Mark sold / Renew /
 *                     Resubmit / Unpublish) and the owner-facing reason.
 *
 * Nothing here activates, publishes or charges anything: every payment action resolves to the SAME listing row's
 * existing Revenue OS / checkpoint doorway, and every relist is limited to what the owner took offline
 * (`dashboardOwnerMayActivateFromStatus`). Payment activation stays with the verified webhook, moderation with staff.
 */
import {
  isAutosRowPubliclyLive,
  isComidaLocalRowPubliclyLive,
  isEmpleosRowPubliclyLive,
  isGenericListingPubliclyLive,
  isRestauranteRowPubliclyLive,
  isServiciosRowPubliclyLive,
  isViajesRowPubliclyLive,
  type AutosParentResolver,
  type BrPublicParentCandidate,
} from "@/app/admin/_lib/adminLivePredicates";
import { isListingRowPublicDetailEligible } from "@/app/(site)/clasificados/lib/listingPublicDetailEligibility";
import { isBrChildParentGateSatisfied } from "@/app/(site)/clasificados/lib/brPublicChildParentVisibility";
import { resolveEmpleosOwnerTransition, isEmpleosFreeLane } from "@/app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy";
import { isBrFsboRow, isBrFsboRowWithinTerm } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";
import { isListingRowWithinEnforcedTerm } from "@/app/lib/listingLifecycle/enforcedTermReadPredicate";
import { comidaLocalOwnerActionPlan, type ComidaLocalOwnerReason } from "@/app/lib/clasificados/comida-local/comidaLocalPaymentResume";
import { parseLeonixListingContract } from "@/app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { dashboardOwnerMayActivateFromStatus } from "./dashboardOwnerRelistPolicy";
import {
  isAutosPrivadoAwaitingPayment,
  isRestauranteAwaitingPayment,
  resolveSharedListingPaymentLane,
} from "./dashboardPendingPayment";

export type DashboardStateCategory =
  | "en-venta"
  | "rentas"
  | "bienes-raices"
  | "clases"
  | "comunidad"
  | "busco"
  | "mascotas"
  | "autos"
  | "restaurantes"
  | "servicios"
  | "empleos"
  | "viajes"
  | "comida-local";

export type { BrPublicParentCandidate };

export const DASHBOARD_GENERIC_STATE_CATEGORIES: readonly DashboardStateCategory[] = [
  "en-venta",
  "rentas",
  "bienes-raices",
  "clases",
  "comunidad",
  "busco",
  "mascotas",
];

/** Loose row projection: every field optional, callers pass the columns they have. */
export type DashboardStateRow = {
  id?: string | null;
  /** `listings.status` | `restaurantes.status` | `servicios.listing_status` | `empleos.lifecycle_status` | ... */
  status?: string | null;
  is_published?: boolean | null;
  /** Viajes only. */
  is_public?: boolean | null;
  category?: string | null;
  seller_type?: string | null;
  /** Autos lane (privado | negocios) or Empleos lane (quick | premium | feria). */
  lane?: string | null;
  expires_at?: string | null;
  published_at?: string | null;
  detail_pairs?: unknown;
  inventory_role?: string | null;
  br_inventory_parent_listing_id?: string | null;
  dealer_inventory_parent_listing_id?: string | null;
  owner_id?: string | null;
  owner_user_id?: string | null;
  suspended_reason?: string | null;
  moderation_reason?: string | null;
};

export type DashboardStateContext = {
  nowMs?: number;
  /** The authenticated owner: stamped onto rows that carry no `owner_id` so the BR child-parent gate can compare owners. */
  ownerId?: string | null;
  /** Bienes Raices inventory-child parent gate: owner's own parent rows by id (omit = gate not evaluated). */
  brParentsById?: ReadonlyMap<string, BrPublicParentCandidate>;
  /** Autos dealer-child parent gate resolver (omit = gate not evaluated). */
  autosParents?: AutosParentResolver;
};

function lc(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Dashboard category key of a shared-`listings` row: the `category` column, else the Leonix branch stamped in
 * `detail_pairs` (older Bienes Raices / Rentas rows). `null` = not a category this machine models.
 */
export function dashboardListingsCategoryKey(row: {
  category?: string | null;
  detail_pairs?: unknown;
}): DashboardStateCategory | null {
  const cat = lc(row.category);
  if (cat === "mascotas-y-perdidos") return "mascotas";
  if (
    cat === "en-venta" ||
    cat === "rentas" ||
    cat === "bienes-raices" ||
    cat === "clases" ||
    cat === "comunidad" ||
    cat === "busco"
  ) {
    return cat;
  }
  const branch = parseLeonixListingContract(row.detail_pairs).branch;
  if (branch === "bienes_raices_privado" || branch === "bienes_raices_negocio") return "bienes-raices";
  if (branch === "rentas_privado" || branch === "rentas_negocio") return "rentas";
  return null;
}

/** Dashboard category key -> the category slug the shared `listings` predicates use. */
export function dashboardPredicateCategory(category: DashboardStateCategory): string {
  return category === "mascotas" ? "mascotas-y-perdidos" : category;
}

/** Typed projection for the FSBO term predicate (`isBrFsboRowWithinTerm` only ever hides a genuine FSBO row past its term). */
function fsboRowLike(row: DashboardStateRow): { category: string; seller_type: string | null; expires_at: string | null } {
  return {
    category: "bienes-raices",
    seller_type: row.seller_type ?? null,
    expires_at: typeof row.expires_at === "string" ? row.expires_at : null,
  };
}

function isPastInstant(iso: unknown, nowMs: number): boolean {
  if (typeof iso !== "string" || !iso.trim()) return false;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) && ms <= nowMs;
}

/**
 * A fixed / paid term that ELAPSED while the row still says `active` (the term is never written back to
 * `status`). Owner counts must not treat such a row as active (Gate 2 items 5-7: Rentas / FSBO / Clases).
 *  - Rentas: a real past `expires_at` (a NULL `expires_at` is "no term stamped" -> not public but not "elapsed");
 *  - Bienes Raices: an FSBO row past its 45-day term (`isBrFsboRowWithinTerm`), or any BR row past `expires_at`;
 *  - Clases: past `expires_at` (`isListingRowWithinEnforcedTerm`);
 *  - En Venta: a real past `expires_at` (the public reader hides it);
 *  - Comunidad / Busco / Mascotas: NEVER - their public readers ignore `expires_at`, so a stale value must not read as expired.
 */
export function dashboardGenericTermElapsed(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  nowMs: number = Date.now(),
): boolean {
  const cat = dashboardPredicateCategory(category);
  // En Venta has no term (no writer sets expires_at; the public reader ignores it) - keep the dashboard aligned with Admin Live.
  if (cat === "comunidad" || cat === "busco" || cat === "mascotas-y-perdidos" || cat === "en-venta") return false;
  if (cat === "clases") {
    return !isListingRowWithinEnforcedTerm({ category: "clases", expires_at: row.expires_at }, nowMs);
  }
  if (cat === "bienes-raices") {
    if (!isBrFsboRowWithinTerm(fsboRowLike(row), nowMs)) return true;
    return isPastInstant(row.expires_at, nowMs);
  }
  return isPastInstant(row.expires_at, nowMs);
}

export type DashboardOwnerReason =
  | "live"
  | "payment_pending"
  | "payment_failed"
  | "draft"
  | "in_review"
  | "changes_requested"
  | "rejected"
  | "paused"
  | "paused_staff_hold"
  | "suspended"
  | "suspended_moderation"
  | "suspended_payment"
  | "expired"
  | "sold"
  | "archived"
  | "archived_staff_hold"
  | "removed"
  | "cancelled"
  | "rented"
  | "not_public"
  | "unknown";

export type DashboardPreviewKind = "public_page" | "draft_preview" | "none";

export type DashboardOwnerPlan = {
  live: boolean;
  linkResolves: boolean;
  termElapsed: boolean;
  /** "View public" - identical to `linkResolves`. */
  viewPublic: boolean;
  /** The category editor may be opened on the SAME row (never a new listing). */
  edit: boolean;
  preview: DashboardPreviewKind;
  /** "Complete / Resume payment" on the SAME listing id (Revenue OS doorway, or the category's own checkpoint). */
  completePayment: boolean;
  pause: boolean;
  /** Owner resume from a pause the owner (or a flow the owner controls) created. */
  resume: boolean;
  archive: boolean;
  markSold: boolean;
  /** Fixed-term renewal (Rentas / FSBO): a paid same-row renewal, never a free relist. */
  renew: boolean;
  /** Viajes: resubmit to review. */
  resubmit: boolean;
  /** Viajes: withdraw a live offer. */
  unpublish: boolean;
  reason: DashboardOwnerReason;
};

const NO_PLAN: DashboardOwnerPlan = {
  live: false,
  linkResolves: false,
  termElapsed: false,
  viewPublic: false,
  edit: false,
  preview: "none",
  completePayment: false,
  pause: false,
  resume: false,
  archive: false,
  markSold: false,
  renew: false,
  resubmit: false,
  unpublish: false,
  reason: "unknown",
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Empleos - the dashboard offers exactly what the server transition policy will accept
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export type EmpleosOwnerTransitions = {
  pause: boolean;
  resume: boolean;
  archive: boolean;
  /** Human reason the row is held (staff hold / never-live archive), for the note. */
  staffHold: boolean;
};

/**
 * Which Empleos owner lifecycle buttons may be offered. Mirrors `resolveEmpleosOwnerTransition` (the SAME function
 * `PATCH /api/clasificados/empleos/listings/[id]` runs) so a button is never a dead 402 / 409:
 *   - pause   published -> paused
 *   - resume  paused -> published (not a staff hold); archived -> published ONLY when the row was ever live AND no
 *             staff reason is attached; a paid-lane `draft` never resumes (payment publishes it)
 *   - archive any owner-archivable state
 * `archived` + a `moderation_reason` is treated as a STAFF hold here even though the server policy only guards
 * paused / pending_review / rejected: the dashboard is intentionally never looser than the server (Gate 2 item 9).
 */
export function dashboardEmpleosOwnerTransitions(row: {
  lane?: string | null;
  lifecycle_status?: string | null;
  published_at?: string | null;
  moderation_reason?: string | null;
}): EmpleosOwnerTransitions {
  const current = lc(row.lifecycle_status);
  const hasStaffReason = Boolean(String(row.moderation_reason ?? "").trim());
  const everPublished = Boolean(String(row.published_at ?? "").trim());
  const ok = (next: string): boolean =>
    resolveEmpleosOwnerTransition({
      lane: row.lane,
      current,
      next,
      hasStaffReason,
      everPublished,
    }).ok;
  const archivedByStaff = current === "archived" && hasStaffReason;
  return {
    pause: current === "published" && ok("paused"),
    resume: current !== "published" && !archivedByStaff && ok("published"),
    archive: current !== "archived" && ok("archived"),
    staffHold: hasStaffReason && (current === "paused" || current === "pending_review" || current === "rejected" || current === "archived"),
  };
}

/**
 * The staff-authored part of a `moderation_reason` worth showing the owner. The machine markers Admin writes
 * (`staff_suspended` / `staff_rejected` / `staff_review`) are internal codes, not copy: they only mean "a staff
 * decision is attached" (already said by the reason note), so they are not echoed.
 */
export function dashboardVisibleModerationReason(reason: string | null | undefined): string | null {
  const s = String(reason ?? "").trim();
  if (!s || /^staff_[a-z_]+$/i.test(s)) return null;
  return s.length > 220 ? `${s.slice(0, 217)}...` : s;
}

/** Owner-safe message for a refused Empleos owner transition (`PATCH` error code). */
export function dashboardEmpleosTransitionErrorMessage(code: string | null | undefined, lang: "es" | "en"): string {
  const es = lang === "es";
  switch (code) {
    case "payment_required":
      return es
        ? "Este anuncio se publica cuando se confirma el pago. Completa el pago para publicarlo."
        : "This listing goes live once payment is confirmed. Complete payment to publish it.";
    case "staff_hold":
      return es
        ? "Leonix tiene este anuncio en revisión o retenido. Solo Leonix puede reactivarlo."
        : "Leonix is holding this listing. Only Leonix can reactivate it.";
    case "forbidden_transition":
      return es ? "Esta acción no está disponible en el estado actual del anuncio." : "This action is not available in the listing's current state.";
    default:
      return es ? "No se pudo actualizar el anuncio. Inténtalo de nuevo." : "Could not update the listing. Please try again.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Live / link truth
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export type DashboardLiveState = { live: boolean; linkResolves: boolean; termElapsed: boolean };

/**
 * Is the row on the public results surface, and does its public detail link resolve? Delegates to the Admin Live
 * predicates (results) and to `isListingRowPublicDetailEligible` (generic detail page). Dedicated tables use their
 * own status columns.
 */
export function dashboardLiveState(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  ctx: DashboardStateContext = {},
): DashboardLiveState {
  const nowMs = ctx.nowMs ?? Date.now();
  const status = lc(row.status);

  if ((DASHBOARD_GENERIC_STATE_CATEGORIES as readonly string[]).includes(category)) {
    const cat = dashboardPredicateCategory(category);
    const rec = { ...row, category: cat, owner_id: row.owner_id ?? ctx.ownerId ?? null } as Record<string, unknown>;
    // A paused / sold row can also carry an elapsed term: it must renew, not "resume" into a dead row.
    const termElapsed =
      status === "active" || status === "sold" || status === "paused" ? dashboardGenericTermElapsed(category, row, nowMs) : false;
    const live = status !== "removed" && isGenericListingPubliclyLive(cat, rec, nowMs, ctx.brParentsById);
    let linkResolves = live;
    if (!linkResolves && status !== "removed") {
      // Documented direct-URL state (`sold` En Venta / Bienes Raices): the detail page renders, results do not list it.
      let eligible = isListingRowPublicDetailEligible(rec, nowMs);
      if (eligible && cat === "bienes-raices") {
        if (!isBrFsboRowWithinTerm(fsboRowLike(row), nowMs)) eligible = false;
        if (eligible && ctx.brParentsById) {
          eligible = isBrChildParentGateSatisfied(
            rec as unknown as Parameters<typeof isBrChildParentGateSatisfied>[0],
            ctx.brParentsById,
          );
        }
      }
      if (eligible && cat === "clases" && !isListingRowWithinEnforcedTerm({ category: "clases", expires_at: row.expires_at }, nowMs)) {
        eligible = false;
      }
      linkResolves = eligible;
    }
    return { live, linkResolves, termElapsed };
  }

  switch (category) {
    case "restaurantes": {
      const live = isRestauranteRowPubliclyLive({ status });
      return { live, linkResolves: live, termElapsed: false };
    }
    case "servicios": {
      const live = isServiciosRowPubliclyLive({ listing_status: status });
      return { live, linkResolves: live, termElapsed: false };
    }
    case "empleos": {
      const live = isEmpleosRowPubliclyLive({ lifecycle_status: status });
      return { live, linkResolves: live, termElapsed: false };
    }
    case "comida-local": {
      const live = isComidaLocalRowPubliclyLive({ status });
      return { live, linkResolves: live, termElapsed: false };
    }
    case "viajes": {
      const live = isViajesRowPubliclyLive({ lifecycle_status: status, is_public: row.is_public });
      return { live, linkResolves: live, termElapsed: false };
    }
    case "autos": {
      const termElapsed = status === "active" && lc(row.lane) === "privado" && isPastInstant(row.expires_at, nowMs);
      const live = isAutosRowPubliclyLive(
        {
          id: row.id,
          status,
          lane: row.lane,
          expires_at: row.expires_at,
          inventory_role: row.inventory_role,
          dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id,
          owner_user_id: row.owner_user_id,
        },
        ctx.autosParents,
        nowMs,
      );
      return { live, linkResolves: live, termElapsed };
    }
    default:
      return { live: false, linkResolves: false, termElapsed: false };
  }
}

/** "View public" gate for any dashboard card. */
export function dashboardViewPublicAllowed(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  ctx?: DashboardStateContext,
): boolean {
  return dashboardLiveState(category, row, ctx).linkResolves;
}

/**
 * Tab bucket for a generic `listings` row on Mis anuncios (Gate 2 items 5-7). "active" means genuinely live
 * (a term-elapsed Rentas / FSBO / Clases row is EXPIRED, not active); "expired" also includes term-elapsed rows.
 */
export function dashboardListingsRowBucket(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  ctx: DashboardStateContext = {},
): "removed" | "moderation" | "expired" | "active" | "other" {
  const nowMs = ctx.nowMs ?? Date.now();
  const status = lc(row.status);
  if (status === "removed") return "removed";
  if (status === "pending" || status === "flagged" || status === "paused") return "moderation";
  if (status === "sold" || status === "expired") return "expired";
  if (status === "active") {
    const isDraft = row.is_published === false;
    if (isDraft) return "other";
    if (dashboardGenericTermElapsed(category, row, nowMs)) return "expired";
    return "active";
  }
  return "other";
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Action plan
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function genericReason(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  st: string,
  state: DashboardLiveState,
  payLane: ReturnType<typeof resolveSharedListingPaymentLane>,
): DashboardOwnerReason {
  if (st === "removed") return "removed";
  if (st === "flagged") return "suspended_moderation";
  if (st === "paused" || st === "unpublished") return "paused";
  if (st === "expired") return "expired";
  // Bienes Raices Negocio is a subscription: an unpaid `pending` main / child row awaits ITS payment (through the publish
  // flow's consent checkpoint - the dashboard offers no base-checkout button for it), it is not sitting in a review queue.
  if (st === "pending") return payLane || category === "bienes-raices" ? "payment_pending" : "in_review";
  if (st === "draft" || st === "pending_payment") return payLane || st === "pending_payment" ? "payment_pending" : "draft";
  if (st === "payment_failed") return "payment_failed";
  if (st === "sold") return state.live ? "live" : "sold";
  if (st === "active") {
    if (row.is_published === false) return "draft";
    if (state.termElapsed) return "expired";
    if (state.live) return "live";
    if (category === "rentas") return "rented";
    return "not_public";
  }
  return "unknown";
}

/** The full owner action plan for one row of one category. */
export function dashboardOwnerActionPlan(
  category: DashboardStateCategory,
  row: DashboardStateRow,
  ctx: DashboardStateContext = {},
): DashboardOwnerPlan {
  const st = lc(row.status);
  const state = dashboardLiveState(category, row, ctx);
  const base: DashboardOwnerPlan = {
    ...NO_PLAN,
    live: state.live,
    linkResolves: state.linkResolves,
    termElapsed: state.termElapsed,
    viewPublic: state.linkResolves,
  };

  // ── shared `listings` lanes ──────────────────────────────────────────────────────────────────
  if ((DASHBOARD_GENERIC_STATE_CATEGORIES as readonly string[]).includes(category)) {
    const cat = dashboardPredicateCategory(category);
    const payLane = resolveSharedListingPaymentLane({
      category: cat,
      status: row.status,
      is_published: row.is_published,
      detail_pairs: row.detail_pairs,
      branch: undefined,
    });
    const isFsbo = cat === "bienes-raices" && isBrFsboRow({ category: "bienes-raices", seller_type: row.seller_type });
    const removed = st === "removed";
    return {
      ...base,
      edit: !removed,
      preview: state.live ? "public_page" : "none",
      completePayment: payLane !== null,
      pause: state.live && st === "active",
      // Owner resume only from a pause; a paused row whose paid term elapsed must renew, not "resume" into a dead row.
      resume: st === "paused" && dashboardOwnerMayActivateFromStatus(st) && !state.termElapsed,
      archive: !removed,
      markSold: state.live && st === "active" && (cat === "en-venta" || cat === "bienes-raices"),
      renew: state.termElapsed && (st === "active" || st === "expired") && (cat === "rentas" || isFsbo),
      reason: genericReason(category, row, st, state, payLane),
    };
  }

  switch (category) {
    case "restaurantes": {
      const awaiting = isRestauranteAwaitingPayment(st);
      const reason: DashboardOwnerReason = state.live
        ? "live"
        : awaiting
          ? "payment_pending"
          : st === "suspended"
            ? lc(row.suspended_reason) === "payment"
              ? "suspended_payment"
              : lc(row.suspended_reason)
                ? "suspended_moderation"
                : "suspended"
            : st === "archived"
              ? "archived"
              : st === "draft"
                ? "draft"
                : "unknown";
      return {
        ...base,
        edit: true,
        preview: state.live ? "public_page" : awaiting ? "draft_preview" : "none",
        completePayment: awaiting,
        reason,
      };
    }
    case "servicios": {
      const awaiting = st === "pending_payment";
      const reason: DashboardOwnerReason = state.live
        ? "live"
        : awaiting
          ? "payment_pending"
          : st === "paused_unpublished" || st === "paused"
            ? "paused"
            : st === "suspended"
              ? lc(row.suspended_reason) === "payment"
                ? "suspended_payment"
                : lc(row.suspended_reason)
                  ? "suspended_moderation"
                  : "suspended"
              : st === "draft"
                ? "draft"
                : st === "archived" || st === "removed"
                  ? "archived"
                  : "unknown";
      return {
        ...base,
        edit: true,
        preview: state.live ? "public_page" : awaiting ? "draft_preview" : "none",
        completePayment: awaiting,
        pause: state.live,
        resume: st === "paused_unpublished",
        reason,
      };
    }
    case "empleos": {
      const transitions = dashboardEmpleosOwnerTransitions({
        lane: row.lane,
        lifecycle_status: st,
        published_at: row.published_at,
        moderation_reason: row.moderation_reason,
      });
      const paidDraft = st === "draft" && !isEmpleosFreeLane(row.lane);
      const reason: DashboardOwnerReason = state.live
        ? "live"
        : paidDraft
          ? "payment_pending"
          : st === "draft"
            ? "draft"
            : st === "pending_review"
              ? "in_review"
              : st === "paused"
                ? transitions.staffHold
                  ? "paused_staff_hold"
                  : "paused"
                : st === "rejected"
                  ? "rejected"
                  : st === "archived"
                    ? transitions.staffHold
                      ? "archived_staff_hold"
                      : "archived"
                    : "unknown";
      return {
        ...base,
        edit: true,
        preview: state.live ? "public_page" : "none",
        completePayment: paidDraft,
        pause: transitions.pause,
        resume: transitions.resume,
        archive: transitions.archive,
        reason,
      };
    }
    case "viajes": {
      const reason: DashboardOwnerReason = state.live
        ? "live"
        : st === "approved"
          ? "not_public"
          : st === "draft"
            ? "draft"
            : st === "submitted" || st === "in_review"
              ? "in_review"
              : st === "changes_requested"
                ? "changes_requested"
                : st === "rejected"
                  ? "rejected"
                  : st === "expired"
                    ? "expired"
                    : st === "unpublished"
                      ? "archived"
                      : "unknown";
      return {
        ...base,
        edit: true,
        preview: "draft_preview",
        resubmit: st === "changes_requested" || st === "rejected" || st === "draft" || st === "unpublished",
        unpublish: state.live,
        reason,
      };
    }
    case "autos": {
      const awaiting = isAutosPrivadoAwaitingPayment({ lane: row.lane, status: st });
      const reason: DashboardOwnerReason = state.live
        ? "live"
        : state.termElapsed
          ? "expired"
          : st === "pending_payment" || (st === "draft" && awaiting)
            ? "payment_pending"
            : st === "payment_failed"
              ? "payment_failed"
              : st === "draft"
                ? "draft"
                : st === "cancelled"
                  ? "cancelled"
                  : st === "removed"
                    ? lc(row.suspended_reason)
                      ? "suspended_moderation"
                      : "removed"
                    : st === "active"
                      ? "not_public"
                      : "unknown";
      return {
        ...base,
        edit: st !== "cancelled",
        preview: "draft_preview",
        completePayment: awaiting,
        // Owner unpublish (active -> removed); restore only a row the owner removed (no staff `suspended_reason`).
        archive: st === "active",
        resume: st === "removed" && !lc(row.suspended_reason),
        renew: state.termElapsed,
        reason,
      };
    }
    case "comida-local": {
      const plan = comidaLocalOwnerActionPlan({ status: st, suspendedReason: row.suspended_reason });
      return {
        ...base,
        live: plan.publicLive,
        linkResolves: plan.viewPublic,
        viewPublic: plan.viewPublic,
        edit: plan.edit,
        preview: plan.publicLive ? "public_page" : plan.completePayment ? "draft_preview" : "none",
        completePayment: plan.completePayment,
        pause: plan.pause,
        resume: plan.resume,
        reason: comidaReasonToOwnerReason(plan.reason),
      };
    }
    default:
      return { ...NO_PLAN };
  }
}

function comidaReasonToOwnerReason(r: ComidaLocalOwnerReason): DashboardOwnerReason {
  switch (r) {
    case "published":
      return "live";
    case "payment_pending":
      return "payment_pending";
    case "draft":
      return "draft";
    case "paused_by_owner":
      return "paused";
    case "paused_staff_hold":
      return "paused_staff_hold";
    case "suspended_moderation":
      return "suspended_moderation";
    case "suspended_payment":
      return "suspended_payment";
    default:
      return "unknown";
  }
}

/** Owner-facing copy for a reason (null when nothing needs saying). */
export function dashboardOwnerReasonNote(reason: DashboardOwnerReason, lang: "es" | "en"): string | null {
  const es = lang === "es";
  switch (reason) {
    case "payment_pending":
      return es
        ? "Aún no está publicado: se publica cuando se confirma el pago. Puedes editarlo o completar el pago."
        : "Not published yet: it goes live once payment is confirmed. You can edit it or complete payment.";
    case "payment_failed":
      return es
        ? "El pago no se completó. Completa el pago para publicar este anuncio; se usa este mismo anuncio."
        : "Payment did not complete. Complete payment to publish this listing; this same listing is used.";
    case "in_review":
      return es ? "En revisión: aún no es público." : "In review: not public yet.";
    case "changes_requested":
      return es ? "Leonix pidió cambios. Edítalo y reenvíalo a revisión." : "Leonix requested changes. Edit it and send it back to review.";
    case "rejected":
      return es ? "Rechazado: no es público. Edítalo y reenvíalo si aplica." : "Rejected: not public. Edit and resubmit if it applies.";
    case "paused":
      return es ? "Pausado: no es visible al público." : "Paused: not visible to the public.";
    case "paused_staff_hold":
    case "archived_staff_hold":
      return es
        ? "Leonix retuvo este anuncio. Puedes editarlo o archivarlo, pero solo Leonix puede reactivarlo."
        : "Leonix is holding this listing. You can edit or archive it, but only Leonix can reactivate it.";
    case "suspended":
    case "suspended_moderation":
      return es ? "Suspendido por Leonix: no es visible al público. Contacta a Leonix para revisarlo." : "Suspended by Leonix: not visible to the public. Contact Leonix to review it.";
    case "suspended_payment":
      return es
        ? "Suspendido por un problema de pago: se restaura cuando el pago se regulariza."
        : "Suspended for a payment problem: it is restored once the payment is resolved.";
    case "expired":
      return es ? "Venció su plazo: ya no es público. Renóvalo para volver a publicarlo." : "Its term ended: no longer public. Renew it to publish again.";
    case "sold":
      return es ? "Marcado como vendido." : "Marked as sold.";
    case "archived":
      return es ? "Archivado: no es visible al público." : "Archived: not visible to the public.";
    case "removed":
      return es ? "Retirado: no es visible al público." : "Removed: not visible to the public.";
    case "cancelled":
      return es ? "Cancelado: no es público." : "Cancelled: not public.";
    case "rented":
      return es ? "Marcado como rentado / bajo contrato: no aparece en resultados públicos." : "Marked rented / under contract: not shown in public results.";
    case "not_public":
      return es ? "Este anuncio no es público ahora mismo." : "This listing is not public right now.";
    case "unknown":
      return es ? "Este anuncio tiene un estado que no reconocemos. Contacta a Leonix." : "This listing has a status we do not recognize. Contact Leonix.";
    default:
      return null;
  }
}

/**
 * How many of the owner's shared-`listings` rows are genuinely LIVE (Gate 2 items 5-7). A row is counted only when it is
 * on the public results surface by its own category's predicate, so a Rentas / FSBO / Clases row whose term elapsed
 * (status still `active`), a rented Rentas row or an orphaned BR child is NOT an "active listing". Rows outside the
 * modelled categories keep the canonical rule (active, `is_published` not false, `expires_at` not past).
 */
export function dashboardLiveListingRows<T extends Record<string, unknown>>(
  rows: ReadonlyArray<T>,
  ownerId: string | null | undefined,
  nowMs: number = Date.now(),
): T[] {
  const typed = rows as ReadonlyArray<DashboardStateRow & { id?: string }>;
  const parents = dashboardBrParentsFromOwnerRows(
    typed.filter((r): r is DashboardStateRow & { id: string } => typeof r.id === "string" && r.id.length > 0),
    ownerId,
  );
  const out: T[] = [];
  rows.forEach((row, i) => {
    const r = typed[i];
    const key = dashboardListingsCategoryKey(r);
    const live = key
      ? dashboardLiveState(key, r, { nowMs, ownerId, brParentsById: parents }).live
      : lc(r.status) === "active" && r.is_published !== false && !isPastInstant(r.expires_at, nowMs);
    if (live) out.push(row);
  });
  return out;
}

export function dashboardCountLiveListingRows(
  rows: ReadonlyArray<Record<string, unknown>>,
  ownerId: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  return dashboardLiveListingRows(rows, ownerId, nowMs).length;
}

/** Build the owner's own BR parent map from their fetched rows (owner rows only: a foreign parent never appears). */
export function dashboardBrParentsFromOwnerRows(
  rows: ReadonlyArray<{
    id: string;
    category?: string | null;
    seller_type?: string | null;
    inventory_role?: string | null;
    status?: string | null;
    is_published?: boolean | null;
  }>,
  ownerUserId: string | null | undefined,
): ReadonlyMap<string, BrPublicParentCandidate> {
  const owner = String(ownerUserId ?? "").trim();
  const map = new Map<string, BrPublicParentCandidate>();
  for (const r of rows) {
    if (!r.id) continue;
    map.set(r.id, {
      id: r.id,
      category: r.category,
      seller_type: r.seller_type,
      inventory_role: r.inventory_role,
      owner_id: owner || null,
      status: r.status,
      is_published: r.is_published,
    });
  }
  return map;
}
