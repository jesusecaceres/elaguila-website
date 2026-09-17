/**
 * Assisted Publishing (Gate 07) — Servicios seeder: maps the neutral BusinessApplicationContext
 * into the EXISTING Servicios browser draft (sessionStorage key
 * `leonix.clasificados.servicios.application.v1`), which the real ClasificadosServiciosApplication
 * already bootstraps from on mount (bootstrapServiciosApplicationStateSync ->
 * readClasificadosServiciosApplicationFromBrowser). Zero changes to the form itself.
 *
 * Hard rule: EXISTING DRAFT WINS. If any Servicios draft is already present in this tab, this
 * function writes nothing and reports `skipped_existing_draft`. It only ever writes a PARTIAL
 * state — normalizeClasificadosServiciosApplicationState() fills every other field with the
 * form's own defaults at read time, exactly as it does for a hand-typed draft.
 *
 * Pure w.r.t. everything except sessionStorage, so the "existing draft wins" contract is
 * unit-testable by injecting a fake Storage.
 */
import type { BusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";
import { CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY } from "./clasificadosServiciosStorage";

export type ServiciosSeedResult = "seeded" | "skipped_existing_draft" | "storage_unavailable";

function mapLanguageIds(languages: readonly string[]): { languageIds: string[]; languageOtherLines: string } {
  const ids = new Set<string>();
  const other: string[] = [];
  for (const raw of languages) {
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    if (v === "es" || v === "spanish" || v === "español" || v === "espanol") ids.add("lang_es");
    else if (v === "en" || v === "english" || v === "inglés" || v === "ingles") ids.add("lang_en");
    else {
      ids.add("lang_otro");
      other.push(raw.trim());
    }
  }
  return { languageIds: [...ids], languageOtherLines: other.join("\n") };
}

/** Builds the partial Servicios draft. Exported separately so it is testable without storage. */
export function buildServiciosSeedFromBusinessContext(ctx: BusinessApplicationContext): Record<string, unknown> {
  const { languageIds, languageOtherLines } = mapLanguageIds(ctx.languages);
  const seed: Record<string, unknown> = {
    businessName: ctx.publicName ?? ctx.businessName,
    city: ctx.address.city ?? "",
    state: ctx.address.stateProvince ?? "",
    country: ctx.address.country ?? "",
    physicalStreet: ctx.address.street ?? "",
    physicalSuite: ctx.address.unit ?? "",
    physicalAddressCity: ctx.address.city ?? "",
    physicalRegion: ctx.address.stateProvince ?? "",
    physicalCountry: ctx.address.country ?? "",
    physicalPostalCode: ctx.address.postalCode ?? "",
    showExactAddress: ctx.address.exactStreetPublic,
    serviceAreaNotes: ctx.serviceAreaText ?? "",
    phone: ctx.phone ?? "",
    phoneOffice: ctx.phoneOffice ?? "",
    whatsapp: ctx.whatsapp ?? "",
    email: ctx.email ?? "",
    website: ctx.website ?? "",
    enableCall: Boolean(ctx.phone),
    enableWhatsapp: Boolean(ctx.whatsapp),
    enableEmail: Boolean(ctx.email),
    enableWebsite: Boolean(ctx.website),
    languageIds,
    languageOtherLines,
    logoUrl: ctx.logoUrl ?? "",
    coverUrl: ctx.heroImageUrl ?? "",
    gallery: ctx.galleryUrls.map((url, i) => ({ id: `biz-${i + 1}`, url, source: "url" as const })),
    aboutText: ctx.aboutText ?? "",
    specialtiesLine: ctx.headline ?? "",
    customBusinessHighlights: [...ctx.highlights],
    socialInstagram: ctx.socials.instagram ?? "",
    socialFacebook: ctx.socials.facebook ?? "",
    socialYoutube: ctx.socials.youtube ?? "",
    socialTiktok: ctx.socials.tiktok ?? "",
    socialLinkedin: ctx.socials.linkedin ?? "",
    socialX: ctx.socials.x ?? "",
    googleBusinessUrl: ctx.googleBusinessUrl ?? "",
    yelpReviewsUrl: ctx.yelpUrl ?? "",
  };
  return seed;
}

/**
 * Writes the seed ONLY when no Servicios draft exists in `store` (existing draft wins).
 * `store` defaults to window.sessionStorage — the same medium the form reads.
 */
export function seedServiciosDraftFromBusinessContext(
  ctx: BusinessApplicationContext,
  store: Pick<Storage, "getItem" | "setItem"> | null = typeof window === "undefined" ? null : safeSessionStorage(),
): ServiciosSeedResult {
  if (!store) return "storage_unavailable";
  try {
    const existing = store.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY);
    if (existing && existing.trim().length > 0) return "skipped_existing_draft";
    store.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, JSON.stringify(buildServiciosSeedFromBusinessContext(ctx)));
    return "seeded";
  } catch {
    return "storage_unavailable";
  }
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
