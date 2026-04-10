/**
 * Admin-managed overrides for Clasificados category UX copy.
 * Stored in `site_section_content` under key `clasificados_category_content` as:
 * `{ "categories": { "<slug>": { ... } } }`.
 * Code remains the source of defaults; DB patches are shallow merges per string key.
 */

export type BilingualPair = { es: string; en: string };

export type BilingualPatch = { es?: string; en?: string };

/** Per detail field key (e.g. `condition`, `brand`) — labels / placeholders / help. */
export type ClasificadosDetailFieldCopyPatch = {
  label?: BilingualPatch;
  placeholder?: BilingualPatch;
  help?: BilingualPatch;
};

/**
 * En Venta — marketplace hub `/clasificados/en-venta` + publish hub `/clasificados/publicar/en-venta`.
 * Defaults live in `enVentaContentDefaults.ts`; merged in `mergeClasificadosCategoryContent.ts`.
 */
export type ClasificadosEnVentaContentPatch = {
  hubLanding?: {
    hero?: BilingualPatch;
    sub?: BilingualPatch;
    searchPh?: BilingualPatch;
    search?: BilingualPatch;
    publish?: BilingualPatch;
    lista?: BilingualPatch;
    /** Legacy single-line trust (optional; hub also supports structured trust rows) */
    trust?: BilingualPatch;
    badge?: BilingualPatch;
    socialProof?: BilingualPatch;
    cityPh?: BilingualPatch;
    categoriesTitle?: BilingualPatch;
    trust1Title?: BilingualPatch;
    trust1Sub?: BilingualPatch;
    trust2Title?: BilingualPatch;
    trust2Sub?: BilingualPatch;
    trust3Title?: BilingualPatch;
    trust3Sub?: BilingualPatch;
    bottomSellTitle?: BilingualPatch;
    bottomSellSub?: BilingualPatch;
    bottomSellCta?: BilingualPatch;
    /** Optional emoji prefix for hero (display-only) */
    heroEmoji?: string;
    /** Optional hero / branding image (https or site path) */
    heroImageUrl?: string;
  };
  publishHub?: {
    title?: BilingualPatch;
    subtitle?: BilingualPatch;
    freeTitle?: BilingualPatch;
    freeDesc?: BilingualPatch;
    proTitle?: BilingualPatch;
    proDesc?: BilingualPatch;
    sfTitle?: BilingualPatch;
    sfDesc?: BilingualPatch;
    back?: BilingualPatch;
    laneFreeEmoji?: string;
    laneProBadge?: string;
    laneSfEmoji?: string;
    /** Primary CTA: back to all categories — path only, relative */
    backHref?: string;
  };
  /** Keys match `DETAIL_FIELDS["en-venta"]` field keys where applicable. */
  detailFields?: Record<string, ClasificadosDetailFieldCopyPatch>;
  /** Staff-only notes in admin; not shown on public site by default (optional future). */
  staffModerationNotes?: BilingualPatch;
};

/** Detail labels + staff only — used for categories without a full hub/publish-hub editor yet. */
export type ClasificadosCategoryDetailOnlyPatch = {
  detailFields?: Record<string, ClasificadosDetailFieldCopyPatch>;
  staffModerationNotes?: BilingualPatch;
};

export type ClasificadosCategoryContentRootPayload = {
  categories?: Record<string, unknown>;
};
