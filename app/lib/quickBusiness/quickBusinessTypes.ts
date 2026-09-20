/**
 * LEONIX QUICK BUSINESS — shared contract (thin intake/orchestration layer only).
 *
 * Doctrine: "We are not creating simplified ads. We are creating simplified intake into the existing ads."
 * For business categories: LESS INPUT → SAME existing canonical business draft → SAME existing preview →
 * SAME existing payment → SAME existing public business page → SAME Business Hub / admin / lifecycle.
 *
 * This module is pure types (no `app/(site)` imports) so server pages and the staff launchpad can read the
 * registry. It deliberately REUSES the certified Quick Classifieds field / step / media / confirmation types so
 * the same field renderer, media step and pure validation serve both programs without touching them.
 */

import type {
  QuickConfirmations,
  QuickIntakeStep,
  QuickIntakeValues,
  QuickLang,
  QuickMediaItem,
  QuickText,
  QuickClassifiedMediaContract,
} from "@/app/lib/quickClassifieds/quickClassifiedTypes";

export type { QuickLang, QuickText };

/** The four Quick Business Core categories (owner priority order). */
export const QUICK_BUSINESS_CATEGORY_KEYS = ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"] as const;
export type QuickBusinessCategoryKey = (typeof QUICK_BUSINESS_CATEGORY_KEYS)[number];

/**
 * `live`   — the shared Quick intake feeds this category's existing canonical draft → preview → checkout.
 * `direct` — reserved posture for a category whose existing canonical product cannot be fed truthfully by a short
 *            intake. Since the Dealer + Bienes closeout (PM decision: Quick MAY ask for the customer's REAL first
 *            vehicle / first property because the canonical product requires it) all four Core categories are
 *            `live`; the `direct` branches in the chooser / intake / launchpad remain as the honest fallback.
 */
export type QuickBusinessStatus = "live" | "direct";

export type QuickBusinessDirectReason = {
  code: "REQUIRES_VEHICLE_INVENTORY" | "REQUIRES_PROPERTY_INVENTORY";
  reason: QuickText;
};

/** Display-only pricing posture. The amount is ALWAYS resolved from `revenuePricingMatrix` at render time. */
export type QuickBusinessPricingPosture = {
  kind: "monthly";
  packageKey: string;
  category: string;
};

/** Existing owner / management surfaces (links only — Quick never builds a dashboard). */
export type QuickBusinessManageAdapter = {
  /** Existing owner dashboard for this category. */
  dashboardHref: string;
  /** Existing edit posture, in words (which existing surface edits the profile). */
  editNote: QuickText;
  /** Existing pause / end posture, in words. */
  endNote: QuickText;
  /** Billing posture (monthly subscription through the existing Revenue OS). */
  billingNote: QuickText;
  /** Real billing management path — always /dashboard/perfil (customer portal). */
  billingHref: string;
};

export type QuickBusinessStaffCustody = {
  /** True only where an EXISTING server path lets Leonix staff save/publish for a client (Servicios today). */
  publishForClientSupported: boolean;
  note: QuickText;
};

/**
 * Quick Business media contract.
 *
 * `QuickClassifiedMediaContract` declares `videoOptional: true` as a LITERAL, because every Quick
 * Classifieds lane permits optional video. Quick Business permits none in any family, so it
 * carries its own contract with `videoOptional` widened to boolean. Reusing the Classifieds type
 * forced the registry to return `false` for a field typed `true` — a real, long-standing type
 * error that blocked the production build.
 */
export type QuickBusinessMediaContract = Omit<QuickClassifiedMediaContract, "videoOptional"> & {
  videoOptional: boolean;
};

export type QuickBusinessDefinition = {
  key: QuickBusinessCategoryKey;
  status: QuickBusinessStatus;
  directReason?: QuickBusinessDirectReason;
  emoji: string;
  label: QuickText;
  tagline: QuickText;
  /** Existing standard application / selector (never a Quick route). */
  standardApplicationPath: string;
  pricing: QuickBusinessPricingPosture;
  media: QuickBusinessMediaContract;
  /**
   * Truthful media wording shown above the shared media step. Servicios / Restaurantes ask for BUSINESS photos;
   * Dealer asks for photos of the FIRST REAL VEHICLE; Bienes asks for photos of the FIRST REAL PROPERTY — the
   * images map onto the existing vehicle / property media shape, so the label must never say "business photo" there.
   */
  mediaIntro: QuickText;
  manage: QuickBusinessManageAdapter;
  staff: QuickBusinessStaffCustody;
  /** Rough "≈ N preguntas" shown on the chooser; derived from the adapter's steps. */
  essentialQuestionCount: number;
};

/**
 * Which existing confirmation component the review step renders.
 * `servicios`      — `ListingRulesConfirmationSection subject="servicios"` (three canonical booleans).
 * `property_agent` — `ListingRulesConfirmationSection subject="property"` + the existing Bienes agente
 *                    "payment after preview" acknowledgement (`brAgenteApplicationPricingCopy().confirmPayment`),
 *                    i.e. exactly the four booleans the Full agente application requires before opening preview.
 * `none`           — the canonical flow has no pre-preview confirmation (Restaurantes, Autos Dealer).
 */
export type QuickBusinessConfirmationSurface = { kind: "servicios" } | { kind: "property_agent" } | { kind: "none" };

/** Certified three booleans + the Bienes agente payment acknowledgement. Quick never pre-ticks any of them. */
export type QuickBusinessConfirmations = QuickConfirmations & { paymentAfterPreview: boolean };

export type QuickBusinessHandoff = {
  /** Language-tagged href of the EXISTING preview that continues the canonical pipeline. */
  href: string;
  kind: "preview";
};

export type QuickBusinessIntakeContext = { lang: QuickLang; routeLang: string };

/**
 * Category adapter — the ONLY per-category code. It must (1) map Quick values into the existing canonical draft
 * shape through the category's own default/merge helpers, (2) run the category's OWN readiness validator and
 * return its issues verbatim when it fails, (3) persist through the category's own draft store API, (4) return the
 * existing preview href. It never inserts rows, uploads media, prices anything or writes an owner id.
 */
export type QuickBusinessCategoryAdapter = {
  category: QuickBusinessCategoryKey;
  steps: readonly QuickIntakeStep[];
  confirmations: QuickBusinessConfirmationSurface;
  buildAndWriteCanonicalDraft: (input: {
    values: QuickIntakeValues;
    media: readonly QuickMediaItem[];
    confirmations: QuickBusinessConfirmations;
    ctx: QuickBusinessIntakeContext;
  }) => Promise<{ ok: true; handoff: QuickBusinessHandoff } | { ok: false; issues: string[] }>;
};
