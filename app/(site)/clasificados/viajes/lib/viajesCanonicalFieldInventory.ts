/**
 * Canonical Viajes field inventory: business (`ViajesNegociosDraft`) + private (`ViajesPrivadoDraft`).
 *
 * Storage: `public.viajes_staged_listings.listing_json` as `{ version: 1, negocios?: … } | { version: 1, privado?: … }`
 * plus row columns: title, hero_image_url, submitter_*, lane, owner_user_id, lifecycle_status, review_notes, moderation_reason, …
 *
 * Browse URL contract: `viajesBrowseContract.ts` (`dest`, `q`, `from`, `t`, `budget`, `audience`, `season`, `duration`, `sort`, …).
 * Facet derivation for staged rows: `viajesDraftToPublicBrowseFacets.ts` + `mapViajesStagedRowToViajesBusinessResult`.
 */

export type ViajesFieldSurface =
  | "listing_json.negocios | listing_json.privado"
  | "row.title | row.hero_image_url | row.submitter_*"
  | "public_filters"
  | "public_results_card"
  | "public_detail"
  | "moderation_admin"
  | "owner_dashboard"
  | "internal_metadata"
  | "not_public_browse";

export type ViajesFieldRow = {
  field: string;
  lane: "business" | "private" | "both";
  stored: string;
  publicFilters: string;
  resultsCard: string;
  detailPage: string;
  moderation: string;
  ownerDash: string;
  classification: ViajesFieldSurface | string;
};

/** Business application — every `ViajesNegociosDraft` key accounted for. */
export const VIAJES_NEGOCIOS_FIELD_AUDIT: ViajesFieldRow[] = [
  { field: "schemaVersion", lane: "business", stored: "listing_json.version", publicFilters: "—", resultsCard: "—", detailPage: "—", moderation: "—", ownerDash: "—", classification: "internal_metadata" },
  { field: "offerType", lane: "business", stored: "listing_json.negocios.offerType", publicFilters: "t (via tripTypeKeys)", resultsCard: "tripTypeKeys", detailPage: "tags / hero kind", moderation: "row", ownerDash: "edit form", classification: "listing_json.negocios | listing_json.privado" },
  { field: "titulo", lane: "business", stored: "row.title + listing_json", publicFilters: "q text match", resultsCard: "offerTitle", detailPage: "title", moderation: "row", ownerDash: "edit", classification: "public_detail" },
  { field: "destino", lane: "business", stored: "listing_json.negocios.destino", publicFilters: "dest, q + destSlugs", resultsCard: "destination, destSlugs", detailPage: "destination", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "ciudadSalida", lane: "business", stored: "listing_json.negocios.ciudadSalida", publicFilters: "from (departureMatches text)", resultsCard: "departureCity", detailPage: "departureCity", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "precio", lane: "business", stored: "listing_json.negocios.precio", publicFilters: "q (free-text haystack)", resultsCard: "price", detailPage: "priceFrom", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "duracion", lane: "business", stored: "listing_json.negocios.duracion", publicFilters: "duration (durationKey)", resultsCard: "duration, durationKey", detailPage: "duration", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "fechas / dateMode / fechaInicio / fechaFin / fechasNota", lane: "business", stored: "listing_json.negocios.*", publicFilters: "season (seasonKeys)", resultsCard: "seasonKeys", detailPage: "dateRange", moderation: "listing_json", ownerDash: "edit", classification: "public_filters + public_detail" },
  { field: "descripcion", lane: "business", stored: "listing_json.negocios.descripcion", publicFilters: "—", resultsCard: "includedSummary fallback", detailPage: "description", moderation: "listing_json", ownerDash: "edit", classification: "public_detail" },
  { field: "incluye", lane: "business", stored: "listing_json.negocios.incluye", publicFilters: "—", resultsCard: "includedSummary", detailPage: "includes", moderation: "listing_json", ownerDash: "edit", classification: "public_detail" },
  { field: "ctaType", lane: "business", stored: "listing_json.negocios.ctaType", publicFilters: "—", resultsCard: "cta drives whatsapp in card", detailPage: "main CTA", moderation: "listing_json", ownerDash: "edit", classification: "public_detail" },
  { field: "familias / parejas / grupos", lane: "business", stored: "listing_json.negocios.*", publicFilters: "audience", resultsCard: "audienceKeys", detailPage: "tags / whoItsFor", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "presupuestoTag", lane: "business", stored: "listing_json.negocios.presupuestoTag", publicFilters: "budget", resultsCard: "budgetBand", detailPage: "tags", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "incluyeHotel / incluyeTransporte / incluyeComida", lane: "business", stored: "listing_json.negocios.*", publicFilters: "t (extra tripTypeKeys)", resultsCard: "tripTypeKeys", detailPage: "includes lines", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "guiaEspanol", lane: "business", stored: "listing_json.negocios.guiaEspanol", publicFilters: "svcLang (+ viajesServiceLanguageKeysFromDraft)", resultsCard: "serviceLanguageKeys", detailPage: "whoItsFor / tags", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "idiomaAtencion", lane: "business", stored: "listing_json.negocios.idiomaAtencion", publicFilters: "svcLang", resultsCard: "serviceLanguageKeys", detailPage: "whoItsFor", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "imagenPrincipal / galeriaUrls / localHero / logos / video", lane: "business", stored: "row.hero_image_url + listing_json", publicFilters: "—", resultsCard: "imageSrc", detailPage: "hero / notes", moderation: "row + json", ownerDash: "edit (local blobs preview-only)", classification: "public_detail + owner_dashboard" },
  { field: "businessName / phone / email / website / whatsapp / socials*", lane: "business", stored: "listing_json + submitter_*", publicFilters: "—", resultsCard: "businessName, whatsapp", detailPage: "partner / contactChannels", moderation: "submitter_*", ownerDash: "edit", classification: "public_detail + moderation_admin" },
  {
    field: "destinationsServed / languages",
    lane: "business",
    stored: "listing_json.negocios.*",
    publicFilters: "q (free-text haystack via ViajesBusinessResult.listingSearchExtras in viajesResultsMatch)",
    resultsCard: "—",
    detailPage: "description meta",
    moderation: "listing_json",
    ownerDash: "edit",
    classification: "public_filters",
  },
];

/**
 * Package 3 — Community Opportunity Intake: every `ViajesIntakeV1` key accounted for.
 * Storage: `listing_json.intake` on the SAME staged row the full application later enriches
 * (one-row identity; lifecycle "draft" until full submit). The intake block is an immutable
 * snapshot after the full application starts — truth authority for prefilled fields moves to
 * the negocios draft; truth authority for the benefit VERDICT is the admin-only
 * `community_benefit_status` column (never `listing_json`).
 */
export type ViajesIntakeFieldRow = {
  field: string;
  source: string;
  storage: string;
  adminVisibility: string;
  publicVisibility: string;
  prefillTarget: string;
  truthAuthority: string;
};

export const VIAJES_INTAKE_FIELD_AUDIT: ViajesIntakeFieldRow[] = [
  { field: "schemaVersion", source: "system", storage: "listing_json.intake.schemaVersion", adminVisibility: "—", publicVisibility: "never", prefillTarget: "—", truthAuthority: "intake snapshot" },
  { field: "businessName", source: "provider (intake §1)", storage: "listing_json.intake + row.submitter_name", adminVisibility: "opportunity panel + queue search", publicVisibility: "only via negocios.businessName after full app", prefillTarget: "negocios.businessName", truthAuthority: "negocios draft after prefill" },
  { field: "contactName", source: "provider (intake §1)", storage: "listing_json.intake.contactName", adminVisibility: "opportunity panel", publicVisibility: "NEVER (intake PII)", prefillTarget: "— (intake-only)", truthAuthority: "intake snapshot" },
  { field: "email", source: "provider (intake §1)", storage: "listing_json.intake + row.submitter_email", adminVisibility: "opportunity panel + queue search", publicVisibility: "only via negocios contact channels the provider publishes", prefillTarget: "negocios.email", truthAuthority: "negocios draft after prefill" },
  { field: "phone", source: "provider (intake §1)", storage: "listing_json.intake + row.submitter_phone", adminVisibility: "opportunity panel", publicVisibility: "only via negocios contact channels the provider publishes", prefillTarget: "negocios.phone", truthAuthority: "negocios draft after prefill" },
  { field: "website", source: "provider (intake §1)", storage: "listing_json.intake.website", adminVisibility: "opportunity panel", publicVisibility: "only via negocios.website", prefillTarget: "negocios.website", truthAuthority: "negocios draft after prefill" },
  { field: "socials", source: "provider (intake §1)", storage: "listing_json.intake.socials", adminVisibility: "opportunity panel", publicVisibility: "only via negocios.socials", prefillTarget: "negocios.socials", truthAuthority: "negocios draft after prefill" },
  { field: "offerType", source: "provider (intake §2)", storage: "listing_json.intake.offerType", adminVisibility: "opportunity panel", publicVisibility: "via negocios.offerType → tripTypeKeys", prefillTarget: "negocios.offerType (+ grupos/familias derivation)", truthAuthority: "negocios draft after prefill" },
  { field: "destino", source: "provider (intake §2)", storage: "listing_json.intake.destino", adminVisibility: "opportunity panel", publicVisibility: "via negocios.destino", prefillTarget: "negocios.destino", truthAuthority: "negocios draft after prefill" },
  { field: "ciudadSalida", source: "provider (intake §2)", storage: "listing_json.intake.ciudadSalida", adminVisibility: "opportunity panel", publicVisibility: "via negocios.ciudadSalida", prefillTarget: "negocios.ciudadSalida", truthAuthority: "negocios draft after prefill" },
  { field: "precio", source: "provider (intake §2)", storage: "listing_json.intake.precio", adminVisibility: "opportunity panel", publicVisibility: "via negocios.precio", prefillTarget: "negocios.precio (composed with priceBasis)", truthAuthority: "negocios draft after prefill" },
  { field: "priceBasis", source: "provider (intake §2)", storage: "listing_json.intake.priceBasis", adminVisibility: "opportunity panel", publicVisibility: "only as text inside negocios.precio", prefillTarget: "folded into negocios.precio", truthAuthority: "intake snapshot" },
  { field: "communityBenefit.types", source: "provider (intake §3)", storage: "listing_json.intake.communityBenefit.types", adminVisibility: "opportunity panel", publicVisibility: "never as raw list", prefillTarget: "— (intake-only; NOT dumped into descripcion/incluye)", truthAuthority: "intake snapshot (claim)" },
  { field: "communityBenefit.description", source: "provider (intake §3)", storage: "listing_json.intake.communityBenefit.description", adminVisibility: "opportunity panel", publicVisibility: "ONLY when community_benefit_status = approved (badge + detail section)", prefillTarget: "— (intake-only)", truthAuthority: "claim: intake snapshot · display: admin column" },
  { field: "communityBenefit.samePublicOffer", source: "provider (intake §3)", storage: "listing_json.intake.communityBenefit.samePublicOffer", adminVisibility: "opportunity panel", publicVisibility: "never", prefillTarget: "—", truthAuthority: "intake snapshot (claim)" },
  { field: "communityBenefit.estimatedValueBand", source: "provider (intake §3)", storage: "listing_json.intake.communityBenefit.estimatedValueBand", adminVisibility: "opportunity panel", publicVisibility: "never", prefillTarget: "—", truthAuthority: "intake snapshot" },
  { field: "communityBenefit.expiration", source: "provider (intake §3)", storage: "listing_json.intake.communityBenefit.expiration", adminVisibility: "opportunity panel", publicVisibility: "never (Package 3)", prefillTarget: "—", truthAuthority: "intake snapshot" },
  { field: "communityBenefit.restrictions", source: "provider (intake §3; includes blackout/qualification notes)", storage: "listing_json.intake.communityBenefit.restrictions", adminVisibility: "opportunity panel", publicVisibility: "never (Package 3)", prefillTarget: "—", truthAuthority: "intake snapshot" },
  { field: "completedAt", source: "server (intake save)", storage: "listing_json.intake.completedAt", adminVisibility: "opportunity panel (updated time)", publicVisibility: "never", prefillTarget: "—", truthAuthority: "server" },
  { field: "community_benefit_status", source: "server (claim recompute) / admin (approve)", storage: "row.community_benefit_status COLUMN (migration 20260825150000; NOT listing_json — owner revisions rewrite the JSON envelope)", adminVisibility: "queue + opportunity panel + approve action", publicVisibility: "gates the public badge (approved only, fail closed)", prefillTarget: "—", truthAuthority: "admin moderation route ONLY for approved" },
];

/** Private application — every `ViajesPrivadoDraft` key accounted for. */
export const VIAJES_PRIVADO_FIELD_AUDIT: ViajesFieldRow[] = [
  { field: "schemaVersion", lane: "private", stored: "listing_json.version", publicFilters: "—", resultsCard: "—", detailPage: "—", moderation: "—", ownerDash: "—", classification: "internal_metadata" },
  { field: "offerType", lane: "private", stored: "listing_json.privado.offerType", publicFilters: "t", resultsCard: "tripTypeKeys", detailPage: "tags", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "titulo", lane: "private", stored: "row.title + listing_json", publicFilters: "q", resultsCard: "offerTitle", detailPage: "title", moderation: "row", ownerDash: "edit", classification: "public_detail" },
  { field: "destino", lane: "private", stored: "listing_json.privado.destino", publicFilters: "dest, q", resultsCard: "destination, destSlugs", detailPage: "destination", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "ciudadSalida", lane: "private", stored: "listing_json.privado.ciudadSalida", publicFilters: "from", resultsCard: "departureCity", detailPage: "departureCity", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "precio", lane: "private", stored: "listing_json.privado.precio", publicFilters: "q haystack", resultsCard: "price", detailPage: "priceFrom", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "duracion + fechas*", lane: "private", stored: "listing_json.privado.*", publicFilters: "duration, season", resultsCard: "durationKey, seasonKeys", detailPage: "dateRange", moderation: "listing_json", ownerDash: "edit", classification: "public_filters + public_detail" },
  { field: "descripcion / incluye", lane: "private", stored: "listing_json.privado.*", publicFilters: "—", resultsCard: "includedSummary", detailPage: "description / includes", moderation: "listing_json", ownerDash: "edit", classification: "public_detail" },
  { field: "familias / parejas / grupos / numeroPersonas", lane: "private", stored: "listing_json.privado.*", publicFilters: "audience (numeroPersonas≥4 → grupos)", resultsCard: "audienceKeys", detailPage: "whoItsFor", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "incluyeHotel / incluyeTransporte / incluyeComida", lane: "private", stored: "listing_json.privado.*", publicFilters: "t extras", resultsCard: "tripTypeKeys", detailPage: "includes", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "guiaEspanol / idiomaAtencion", lane: "private", stored: "listing_json.privado.*", publicFilters: "svcLang", resultsCard: "serviceLanguageKeys", detailPage: "whoItsFor", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "politicaReserva", lane: "private", stored: "listing_json.privado.politicaReserva", publicFilters: "—", resultsCard: "—", detailPage: "detail body", moderation: "listing_json", ownerDash: "edit", classification: "public_detail" },
  { field: "presupuestoTag", lane: "private", stored: "listing_json.privado.presupuestoTag", publicFilters: "budget", resultsCard: "budgetBand", detailPage: "tags", moderation: "listing_json", ownerDash: "edit", classification: "public_filters" },
  { field: "imagenUrl / galeria / local blobs", lane: "private", stored: "row.hero + listing_json", publicFilters: "—", resultsCard: "imageSrc", detailPage: "hero", moderation: "row+json", ownerDash: "edit", classification: "public_detail" },
  { field: "displayName / cta / phone / email / web / social*", lane: "private", stored: "listing_json + submitter_*", publicFilters: "—", resultsCard: "businessName, whatsapp", detailPage: "partner / contact", moderation: "submitter_*", ownerDash: "edit", classification: "public_detail + moderation_admin" },
];
