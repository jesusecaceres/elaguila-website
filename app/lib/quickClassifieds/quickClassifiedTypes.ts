/**
 * LEONIX QUICK CLASSIFIEDS — shared framework contract.
 *
 * Doctrine: "We are not creating simplified ads. We are creating simplified intake into the existing ads."
 *
 * This module is pure types + no runtime imports from `app/(site)` so it can be consumed by server pages
 * (chooser, staff launchpad) and by the client intake alike. Category adapters that need canonical
 * taxonomies / draft stores live under `app/(site)/publicar/rapido/_adapters` and implement
 * `QuickClassifiedCategoryAdapter`.
 *
 * The framework OWNS: ES/EN Quick copy, field ordering, step validation, the >= 1 real image rule,
 * progress, category selection, the mapping call into the existing canonical draft and the route handoff.
 * It never owns canonical listing data, renderers, result cards, prices, Revenue OS, entitlement,
 * canonical lifecycle, analytics or admin queues.
 */

import type { CanonicalCategoryKey } from "@/app/lib/listingIdentity/types";

export type QuickLang = "es" | "en";

export type QuickText = { es: string; en: string };

/** The nine Phase 1 classified categories. Keys are the public category slugs already used by the gateway. */
export const QUICK_CLASSIFIED_CATEGORY_KEYS = [
  "en-venta",
  "rentas",
  "empleos",
  "autos",
  "bienes-raices",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
] as const;

export type QuickClassifiedCategoryKey = (typeof QUICK_CLASSIFIED_CATEGORY_KEYS)[number];

/**
 * `live`    — the shared intake feeds this category's existing pipeline.
 * `blocked` — cold forensics found the existing pipeline cannot honour a Quick lock (e.g. the Media Lock);
 *             the category is still listed honestly and links to its existing standard application only.
 */
export type QuickClassifiedStatus = "live" | "blocked";

export type QuickClassifiedBlocker = {
  code: "BLOCKED_BY_EXISTING_MEDIA_OUTPUT" | "BLOCKED_BY_EXISTING_PIPELINE";
  reason: QuickText;
};

/** Display-only pricing posture. The price itself is always read from `revenuePricingMatrix` (server authority). */
export type QuickClassifiedPricingPosture =
  | { kind: "free" }
  | { kind: "paid"; packageKey: string; category: string };

/**
 * Lifecycle wording adapter — maps Quick's five verbs onto what the canonical category truly supports.
 * Nothing here invents a state; `endKind` names the existing action, `null` means the category has none.
 */
export type QuickClassifiedLifecycleAdapter = {
  /** Existing owner surface for this category (dashboard list). */
  manageHref: string;
  /** Category wording for "end" — e.g. "Ya se rentó / Mark rented" — or null when the category has no end verb. */
  endLabel: QuickText | null;
  /** Which existing action `endLabel` maps to. */
  endKind: "sold" | "rented" | "filled" | "archive" | "unpublish" | null;
  /** Whether the canonical category has an owner renewal path (same row, same ID). */
  renewSupported: boolean;
  renewLabel: QuickText | null;
  /** Whether the canonical category has an owner edit surface. */
  editSupported: boolean;
  /** Bilingual note shown under the verbs on the "My Ad" doorway (e.g. expiry posture). */
  note: QuickText | null;
};

export type QuickClassifiedMediaContract = {
  /** Media Lock — every Quick ad needs at least one real image (never lowered below 1). */
  minImages: 1;
  /** Canonical category cap (null = the canonical lane is uncapped). */
  maxImages: number | null;
  /** Video is optional everywhere in Quick and never replaces the image minimum. */
  videoOptional: true;
  /** Bilingual helper shown on the media step (e.g. "Hasta 8 fotos"). */
  note: QuickText;
};

export type QuickFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "select"
  | "chips"
  | "city"
  | "zip"
  | "phone"
  | "email"
  | "date"
  | "time"
  | "toggle";

export type QuickFieldOption = { value: string; label: QuickText };

export type QuickIntakeValue = string | string[] | boolean;
export type QuickIntakeValues = Record<string, QuickIntakeValue | undefined>;

export type QuickClassifiedFieldDefinition = {
  key: string;
  kind: QuickFieldKind;
  label: QuickText;
  hint?: QuickText;
  placeholder?: QuickText;
  /** Static or conditional requirement. */
  required?: boolean | ((values: QuickIntakeValues) => boolean);
  /** Static or dependent option list (select / chips). */
  options?: readonly QuickFieldOption[] | ((values: QuickIntakeValues) => readonly QuickFieldOption[]);
  /** Hide the field until the predicate is true. */
  showWhen?: (values: QuickIntakeValues) => boolean;
  maxLength?: number;
  /** For `chips`: maximum selections (default unlimited). */
  maxSelections?: number;
  /** Autocomplete attribute for browsers / password managers. */
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  /** For `city`: whether the canonical category requires a NorCal canonical city (community family) or accepts free text. */
  cityMode?: "canonical" | "free";
};

export type QuickIntakeStep = {
  id: string;
  title: QuickText;
  intro?: QuickText;
  fields: readonly QuickClassifiedFieldDefinition[];
  /** Cross-field rule: at least one of `keys` must be filled (e.g. one contact channel). */
  atLeastOne?: { keys: readonly string[]; message: QuickText };
};

/** One captured image. `dataUrl` is the same browser-local representation every canonical draft already uses. */
export type QuickMediaItem = {
  id: string;
  dataUrl: string;
  fileName: string;
  mime: string;
};

/** Exact canonical confirmation booleans; Quick never pre-ticks them. */
export type QuickConfirmations = {
  infoTruthful: boolean;
  mediaAccurate: boolean;
  rulesAccepted: boolean;
};

/** Which existing confirmation component the review step renders. */
export type QuickConfirmationSurface =
  | { kind: "listing_rules"; subject: "item" | "property" }
  | { kind: "community"; variant: "clases" | "comunidad" | "mascotas" | "busco" }
  | { kind: "none" };

export type QuickHandoffResult = {
  /** Language-tagged href of the EXISTING preview (or application) that continues the canonical pipeline. */
  href: string;
  /** Where the customer lands. Recorded for analytics-free UX copy ("Abriendo tu vista previa…"). */
  kind: "preview" | "application";
};

export type QuickIntakeContext = {
  lang: QuickLang;
  /** Full SupportedLang for route tagging (Quick copy is ES/EN only). */
  routeLang: string;
};

/**
 * Category adapter — the ONLY per-category code. Lives under `app/(site)/publicar/rapido/_adapters`.
 * `buildAndWriteCanonicalDraft` must (1) map Quick values into the existing canonical draft shape through the
 * category's own normalize/merge function, (2) run the category's own required-for-preview gate and return its
 * issues verbatim when it fails, (3) persist through the category's own draft store API (awaiting async stores),
 * (4) return the existing preview/application href. It must never insert rows, upload media, or price anything.
 */
export type QuickClassifiedCategoryAdapter = {
  category: QuickClassifiedCategoryKey;
  steps: readonly QuickIntakeStep[];
  confirmations: QuickConfirmationSurface;
  buildAndWriteCanonicalDraft: (input: {
    values: QuickIntakeValues;
    media: readonly QuickMediaItem[];
    confirmations: QuickConfirmations;
    ctx: QuickIntakeContext;
  }) => Promise<{ ok: true; handoff: QuickHandoffResult } | { ok: false; issues: string[] }>;
};

/** Server-safe category metadata (no taxonomy imports). */
export type QuickClassifiedDefinition = {
  key: QuickClassifiedCategoryKey;
  /** Canonical pipeline this Quick lane feeds (registry truth). */
  pipeline: CanonicalCategoryKey;
  status: QuickClassifiedStatus;
  blocker?: QuickClassifiedBlocker;
  emoji: string;
  label: QuickText;
  /** One line under the label on the chooser / launchpad. */
  tagline: QuickText;
  /** Existing standard application / checkpoint entry for this category (never a Quick route). */
  standardApplicationPath: string;
  pricing: QuickClassifiedPricingPosture;
  media: QuickClassifiedMediaContract;
  lifecycle: QuickClassifiedLifecycleAdapter;
  /** Rough count shown as "≈ N preguntas" on the chooser; derived from the adapter at build time. */
  essentialQuestionCount: number;
};
