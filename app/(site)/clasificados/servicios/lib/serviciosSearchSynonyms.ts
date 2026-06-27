import { BUSINESS_TYPE_PRESETS } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";

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

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeServiciosSearchText(value: string | undefined): string {
  return stripDiacritics(value ?? "").trim().toLowerCase();
}

function groupIsSupported(presetIds: string[]): boolean {
  return presetIds.some((id) => SUPPORTED_PRESET_IDS.has(id));
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
