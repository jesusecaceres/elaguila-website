/**
 * ⚠️38A — Servicios structured bilingual discovery adapter (2026-09-14).
 *
 * Plugs the taxonomy Servicios ALREADY persists into the shared discovery foundation
 * (`app/lib/clasificados/discovery/*`). No new ids, no new tables, no translation call:
 *
 *   businessType  opsMeta.businessTypeId (publish route) or exact catalog label of hero.categoryLine
 *   group         `internal_group` column
 *   service       services[].id  "svc_<preset::chip>"           (custom_offer_* = owner text)
 *   reason        trust[].id     "trust_<preset::chip>"         (custom_reason  = owner text)
 *   highlight     businessHighlights[].id "bh_preset_<bh_*>"     (bh_custom_*   = owner text)
 *   quickFact     exact catalog label (ids are not persisted for quick facts)
 *   language      opsMeta.discovery.languageChipIds — languages the business SERVES (never authoring language)
 *   amenity       amenityOptionIds
 *   payment       paymentMethodIds
 *
 * Every concept contributes BOTH catalog labels (+ approved aliases) to the row's search document, so
 * a Spanish-authored "Techos y Canales" listing is found by "roofing" and an English-authored
 * "Plumbing" listing by "plomero". Owner free text stays searchable in its ORIGINAL language only
 * (⚠️38B — cross-language custom prose — is deliberately deferred).
 */
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getBusinessTypePreset } from "@/app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { LANGUAGE_OPTION_CHIPS } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import {
  canonicalBusinessTypeEntry,
  canonicalPresetChip,
  type ServiciosCanonicalChipKind,
} from "@/app/(site)/servicios/lib/serviciosCanonicalPresetLabels";
import { getServiciosAmenityOption, isServiciosAmenityOptionId } from "@/app/(site)/servicios/lib/serviciosAmenitiesCatalog";
import { getServiciosPaymentMethodLabel, isServiciosPaymentMethodId } from "@/app/(site)/servicios/lib/serviciosPaymentMethodCatalog";
import {
  conceptKey,
  emptyCanonicalIntent,
  type CanonicalConceptLabels,
  type CanonicalConceptRef,
  type CanonicalIntent,
  type CategoryDiscoveryAdapter,
} from "@/app/lib/clasificados/discovery/canonicalTaxonomyAdapter";
import { normalizeBilingualSearchKey } from "@/app/lib/clasificados/discovery/bilingualSearchText";
import { formatServiciosInternalGroupForDiscovery } from "./serviciosInternalGroupDisplay";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import {
  expandServiciosSearchTerms,
  normalizeServiciosSearchText,
  serviciosPresetIdsTouchedByQuery,
  serviciosSearchAliasesForPreset,
} from "./serviciosSearchSynonyms";
import { readServiciosProfileBusinessTypeId } from "./serviciosTemplateRouting";

export const SERVICIOS_CONCEPT_KIND = {
  businessType: "businessType",
  group: "group",
  service: "service",
  reason: "reason",
  quickFact: "quickFact",
  highlight: "highlight",
  language: "language",
  amenity: "amenity",
  payment: "payment",
} as const;

const SERVICE_PRESET_PREFIX = "svc_";
const REASON_PRESET_PREFIX = "trust_";
const HIGHLIGHT_PRESET_PREFIX = "bh_preset_";
const LANGUAGE_CHIP_IDS = new Set(LANGUAGE_OPTION_CHIPS.map((c) => c.id));

/** Minimal row shape the adapter reads — the public row, or anything carrying its `profile_json`. */
export type ServiciosDiscoveryRow = Pick<ServiciosPublicListingRow, "profile_json"> &
  Partial<Pick<ServiciosPublicListingRow, "business_name" | "city" | "internal_group">>;

export function serviciosBusinessTypeConceptKey(businessTypeId: string): string {
  return conceptKey({ kind: SERVICIOS_CONCEPT_KIND.businessType, id: normalizeBilingualSearchKey(businessTypeId) });
}

/** Canonical business type of a row: persisted id first, else the exact catalog label of the category line. */
export function serviciosRowBusinessTypeId(pj: ServiciosBusinessProfile): string | null {
  const persisted = readServiciosProfileBusinessTypeId(pj);
  if (persisted && getBusinessTypePreset(persisted)) return persisted;
  const line = pj.hero?.categoryLine?.trim();
  if (!line) return null;
  return canonicalBusinessTypeEntry(line)?.id ?? null;
}

/**
 * Languages the business can serve customers in — canonical chip ids. Authoritative source is the
 * discovery facet written at publish; the hero-badge fallback only serves rows published before it
 * existed. Source / authoring language is never consulted.
 */
export function serviciosLanguagesServedFromProfile(pj: ServiciosBusinessProfile): string[] {
  const ids = pj.opsMeta?.discovery?.languageChipIds;
  if (Array.isArray(ids) && ids.length) {
    return ids.filter((id): id is string => typeof id === "string" && LANGUAGE_CHIP_IDS.has(id));
  }
  const out = new Set<string>();
  for (const badge of pj.hero?.badges ?? []) {
    if (!badge) continue;
    const label = badge.label ?? "";
    if (badge.kind === "spanish") out.add("lang_es");
    else if (badge.kind === "custom" && /inglés|ingles|english/i.test(label)) out.add("lang_en");
    else if (badge.kind === "custom" && /otro|other/i.test(label)) out.add("lang_otro");
  }
  return [...out];
}

/** Free-text promo / offer fields on the wire (supports legacy keys like title / details). */
export function serviciosWirePromotionalTextFields(pj: ServiciosBusinessProfile): string[] {
  const out: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim()) out.push(s);
  };
  push(pj.promo?.headline);
  push(pj.promo?.footnote);
  for (const p of pj.promotions ?? []) {
    const o = p as Record<string, unknown>;
    push(o.headline);
    push(o.footnote);
    push(o.title);
    push(o.details);
    push(o.description);
  }
  return out;
}

function chipConcept(kind: ServiciosCanonicalChipKind, ref: { id?: string | null; label?: string | null }): CanonicalConceptRef | null {
  const chip = canonicalPresetChip(kind, ref);
  return chip ? { kind, id: chip.id } : null;
}

function conceptLabels(ref: CanonicalConceptRef): CanonicalConceptLabels | null {
  switch (ref.kind) {
    case SERVICIOS_CONCEPT_KIND.businessType: {
      const preset = getBusinessTypePreset(ref.id);
      return preset ? { es: preset.labelEs, en: preset.labelEn } : null;
    }
    case SERVICIOS_CONCEPT_KIND.group: {
      const es = formatServiciosInternalGroupForDiscovery(ref.id, "es");
      const en = formatServiciosInternalGroupForDiscovery(ref.id, "en");
      return es && en ? { es, en } : null;
    }
    case SERVICIOS_CONCEPT_KIND.service:
    case SERVICIOS_CONCEPT_KIND.reason:
    case SERVICIOS_CONCEPT_KIND.quickFact:
    case SERVICIOS_CONCEPT_KIND.highlight:
    case SERVICIOS_CONCEPT_KIND.language: {
      const chip = canonicalPresetChip(ref.kind, { id: ref.id });
      return chip ? { es: chip.es, en: chip.en } : null;
    }
    case SERVICIOS_CONCEPT_KIND.amenity:
      return isServiciosAmenityOptionId(ref.id) ? { ...getServiciosAmenityOption(ref.id).label } : null;
    case SERVICIOS_CONCEPT_KIND.payment:
      return isServiciosPaymentMethodId(ref.id)
        ? { es: getServiciosPaymentMethodLabel(ref.id, "es"), en: getServiciosPaymentMethodLabel(ref.id, "en") }
        : null;
    default:
      return null;
  }
}

function conceptAliases(ref: CanonicalConceptRef): readonly string[] {
  if (ref.kind !== SERVICIOS_CONCEPT_KIND.businessType) return [];
  return serviciosSearchAliasesForPreset(ref.id);
}

function intentFromQuery(rawQuery: string | null | undefined): CanonicalIntent {
  const normalizedQuery = normalizeBilingualSearchKey(rawQuery);
  if (!normalizedQuery) return emptyCanonicalIntent();
  const conceptKeys = new Set<string>();
  for (const presetId of serviciosPresetIdsTouchedByQuery(normalizedQuery)) {
    conceptKeys.add(serviciosBusinessTypeConceptKey(presetId));
  }
  const exact = canonicalBusinessTypeEntry(normalizedQuery);
  if (exact) conceptKeys.add(serviciosBusinessTypeConceptKey(exact.id));
  return {
    conceptKeys,
    terms: expandServiciosSearchTerms(rawQuery ?? undefined),
    normalizedQuery,
  };
}

function rowConcepts(row: ServiciosDiscoveryRow): readonly CanonicalConceptRef[] {
  const pj = row.profile_json;
  const out: CanonicalConceptRef[] = [];
  const seen = new Set<string>();
  const add = (ref: CanonicalConceptRef | null) => {
    if (!ref) return;
    const key = conceptKey(ref);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(ref);
  };

  const businessTypeId = serviciosRowBusinessTypeId(pj);
  if (businessTypeId) add({ kind: SERVICIOS_CONCEPT_KIND.businessType, id: normalizeBilingualSearchKey(businessTypeId) });
  const group = (row.internal_group ?? "").trim();
  if (group) add({ kind: SERVICIOS_CONCEPT_KIND.group, id: group });

  for (const s of pj.services ?? []) {
    const id = typeof s?.id === "string" ? s.id : "";
    if (id.startsWith(SERVICE_PRESET_PREFIX)) add(chipConcept("service", { id: id.slice(SERVICE_PRESET_PREFIX.length), label: s.title }));
  }
  for (const t of pj.trust ?? []) {
    const id = typeof t?.id === "string" ? t.id : "";
    if (id.startsWith(REASON_PRESET_PREFIX)) add(chipConcept("reason", { id: id.slice(REASON_PRESET_PREFIX.length), label: t.label }));
  }
  for (const h of pj.businessHighlights ?? []) {
    const id = typeof h?.id === "string" ? h.id : "";
    if (id.startsWith(HIGHLIGHT_PRESET_PREFIX)) add(chipConcept("highlight", { id: id.slice(HIGHLIGHT_PRESET_PREFIX.length), label: h.label }));
  }
  for (const f of pj.quickFacts ?? []) {
    if (f && f.kind !== "custom" && typeof f.label === "string") add(chipConcept("quickFact", { label: f.label }));
  }
  for (const id of serviciosLanguagesServedFromProfile(pj)) add({ kind: SERVICIOS_CONCEPT_KIND.language, id });
  for (const id of pj.amenityOptionIds ?? []) {
    if (typeof id === "string" && isServiciosAmenityOptionId(id)) add({ kind: SERVICIOS_CONCEPT_KIND.amenity, id });
  }
  for (const id of pj.paymentMethodIds ?? []) {
    if (typeof id === "string" && isServiciosPaymentMethodId(id)) add({ kind: SERVICIOS_CONCEPT_KIND.payment, id });
  }
  return out;
}

function rowLiterals(row: ServiciosDiscoveryRow): readonly string[] {
  const pj = row.profile_json;
  const out: string[] = [
    row.business_name ?? pj.identity?.businessName ?? "",
    row.city ?? "",
    pj.contact?.physicalPostalCode ?? "",
    pj.contact?.physicalCity ?? "",
    pj.hero?.locationSummary ?? "",
    pj.hero?.state ?? "",
    pj.opsMeta?.discovery?.state ?? "",
    row.internal_group ?? "",
    pj.hero?.country ?? "",
    pj.opsMeta?.discovery?.country ?? "",
  ];
  for (const item of pj.serviceAreas?.items ?? []) {
    if (item?.label) out.push(item.label);
  }
  return out;
}

/**
 * Owner-authored text in its ORIGINAL language — the same haystacks the keyword filter always
 * searched (resolved through the public sanitizer so the search sees what the page shows).
 */
function rowCustomText(row: ServiciosDiscoveryRow): readonly string[] {
  const pj = row.profile_json;
  const out: string[] = [];
  const push = (s: unknown) => {
    if (typeof s === "string" && s.trim()) out.push(s);
  };
  let profile: ReturnType<typeof resolveServiciosProfile> | null = null;
  try {
    profile = resolveServiciosProfile({ ...pj }, "es");
  } catch {
    profile = null;
  }
  push(pj.hero?.categoryLine);
  push(profile?.about?.text ?? pj.about?.text);
  push(profile?.about?.specialtiesLine ?? pj.about?.specialtiesLine);
  for (const s of profile?.services ?? pj.services ?? []) {
    push(s?.title);
    push(s?.secondaryLine);
  }
  for (const c of pj.customAmenityOptions ?? []) push(c);
  for (const h of pj.businessHighlights ?? []) push(h?.label);
  for (const t of profile?.trust ?? pj.trust ?? []) push(t?.label);
  for (const f of profile?.quickFacts ?? pj.quickFacts ?? []) push(f?.label);
  for (const h of profile?.highlights ?? []) push(h?.label);
  for (const r of profile?.reviews ?? pj.reviews ?? []) {
    push(r?.quote);
    push(r?.authorName);
  }
  for (const p of profile?.promotions ?? []) {
    push(p?.headline);
    push(p?.footnote);
  }
  for (const raw of serviciosWirePromotionalTextFields(pj)) push(raw);
  return out;
}

export const serviciosDiscoveryAdapter: CategoryDiscoveryAdapter<ServiciosDiscoveryRow> = {
  category: "servicios",
  conceptLabels,
  conceptAliases,
  intentFromQuery,
  rowConcepts,
  rowLiterals,
  rowCustomText,
  rowLanguagesServed: (row) => serviciosLanguagesServedFromProfile(row.profile_json),
};

/** Normalized form of a `type=` URL value (canonical business-type id). */
export function normalizeServiciosBusinessTypeParam(value: string | null | undefined): string {
  return normalizeServiciosSearchText(value ?? undefined).replace(/\s+/g, "");
}
