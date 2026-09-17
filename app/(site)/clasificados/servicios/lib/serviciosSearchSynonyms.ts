import { BUSINESS_TYPE_PRESETS } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { normalizeBilingualSearchText } from "@/app/lib/clasificados/discovery/bilingualSearchText";

const SUPPORTED_PRESET_IDS = new Set(BUSINESS_TYPE_PRESETS.map((p) => p.id));

const SYNONYM_GROUPS: Array<{ presetIds: string[]; terms: string[] }> = [
  {
    presetIds: ["plomeria"],
    terms: ["plomero", "plomeria", "plomería", "plumbing", "plumber"],
  },
  {
    presetIds: ["electricista"],
    terms: ["electricista", "electricidad", "electrico", "eléctrico", "electrical", "electrician"],
  },
  {
    presetIds: ["limpieza_hogares"],
    terms: ["limpieza", "cleaning", "cleaner", "house cleaning", "limpieza de casas", "limpieza de hogares"],
  },
  {
    presetIds: ["jardineria_paisajismo"],
    terms: ["jardinero", "jardineria", "jardinería", "landscaping", "yard work", "gardening"],
  },
  {
    presetIds: ["mecanica_general"],
    terms: ["mecanico", "mecánico", "mecanica", "mecánica", "auto repair", "taller", "mechanic", "mechanics"],
  },
  {
    presetIds: ["abogado_asesoria_legal"],
    terms: ["abogado", "abogada", "legal", "lawyer", "attorney", "asesoria legal", "asesoría legal"],
  },
  {
    presetIds: ["contador_impuestos"],
    terms: ["contador", "contadora", "taxes", "impuestos", "accounting", "accountant", "bookkeeping"],
  },
  {
    presetIds: ["dentista_odontologia"],
    terms: ["dentista", "dental", "dentist", "odontologia", "odontología"],
  },
  {
    presetIds: ["peluqueria_barberia"],
    terms: ["barberia", "barbería", "peluqueria", "peluquería", "beauty", "salon", "salón", "barber"],
  },
  {
    presetIds: ["tutoria_clases_particulares"],
    terms: ["tutor", "tutoria", "tutoría", "clases", "tutoring", "private lessons"],
  },
];

/** \u26a0\ufe0f38A \u2014 one shared normalizer (byte-identical semantics: NFD \u2192 strip marks \u2192 trim \u2192 lowercase). */
export function normalizeServiciosSearchText(value: string | undefined): string {
  return normalizeBilingualSearchText(value);
}

function groupIsSupported(presetIds: string[]): boolean {
  return presetIds.some((id) => SUPPORTED_PRESET_IDS.has(id));
}

/** Approved bilingual aliases attached to a canonical business-type preset id (\u26a0\ufe0f38A adapter input). */
export function serviciosSearchAliasesForPreset(presetId: string): string[] {
  const out: string[] = [];
  for (const group of SYNONYM_GROUPS) {
    if (!group.presetIds.includes(presetId)) continue;
    for (const term of group.terms) {
      const n = normalizeServiciosSearchText(term);
      if (n && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/**
 * Canonical business-type preset ids a normalized query resolves to EXACTLY \u2014 the query contains an
 * approved alias ("plumbers" \u2283 "plumber"). Shorter partial typing ("plumb") widens terms only.
 */
export function serviciosPresetIdsTouchedByQuery(normalizedQuery: string): string[] {
  const q = normalizeServiciosSearchText(normalizedQuery);
  if (!q) return [];
  const out: string[] = [];
  for (const group of SYNONYM_GROUPS) {
    if (!groupIsSupported(group.presetIds)) continue;
    const hit = group.terms.some((term) => {
      const n = normalizeServiciosSearchText(term);
      return n.length > 0 && q.includes(n);
    });
    if (!hit) continue;
    for (const id of group.presetIds) {
      if (SUPPORTED_PRESET_IDS.has(id) && !out.includes(id)) out.push(id);
    }
  }
  return out;
}

export function expandServiciosSearchTerms(raw: string | undefined): string[] {
  const q = normalizeServiciosSearchText(raw);
  if (!q) return [];

  const terms = new Set<string>([q]);
  for (const group of SYNONYM_GROUPS) {
    if (!groupIsSupported(group.presetIds)) continue;
    const normalizedTerms = group.terms.map(normalizeServiciosSearchText).filter(Boolean);
    const touches = normalizedTerms.some((term) => q.includes(term) || term.includes(q));
    if (!touches) continue;
    for (const term of normalizedTerms) terms.add(term);
  }
  return [...terms];
}
