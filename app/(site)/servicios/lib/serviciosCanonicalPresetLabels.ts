import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { BUSINESS_TYPE_PRESETS } from "@/app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { BUSINESS_HIGHLIGHT_PRESET_CHIPS } from "@/app/(site)/clasificados/publicar/servicios/lib/businessHighlightPresets";
import {
  LANGUAGE_OPTION_CHIPS,
  type ChipDef,
} from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

/* ==============================================================================================
 * Servicios canonical preset labels — ONE deterministic ES ↔ EN map over the catalogs the owner
 * picks from. Pure (no I/O, no translation API). Consumed by the Translate Ad overlay (⚠️37) and by
 * the structured bilingual discovery adapter (⚠️38A) so translation and search can never disagree
 * about what a preset is called.
 * ============================================================================================ */
export type ServiciosCanonicalChipKind = "service" | "reason" | "quickFact" | "highlight" | "language";

type ChipIndex = { byId: Map<string, ChipDef>; byLabel: Map<string, ChipDef> };
type BusinessTypeLabelEntry = { id: string; es: string; en: string };

function normLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

let CHIP_INDEX: Record<ServiciosCanonicalChipKind, ChipIndex> | null = null;
let BUSINESS_TYPE_LABELS: Map<string, BusinessTypeLabelEntry> | null = null;

function addChips(index: ChipIndex, chips: readonly ChipDef[]) {
  for (const chip of chips) {
    index.byId.set(chip.id, chip);
    for (const label of [chip.es, chip.en]) {
      const key = normLabel(label);
      if (key && !index.byLabel.has(key)) index.byLabel.set(key, chip);
    }
  }
}

function chipIndex(): Record<ServiciosCanonicalChipKind, ChipIndex> {
  if (CHIP_INDEX) return CHIP_INDEX;
  const make = (): ChipIndex => ({ byId: new Map(), byLabel: new Map() });
  const idx: Record<ServiciosCanonicalChipKind, ChipIndex> = {
    service: make(),
    reason: make(),
    quickFact: make(),
    highlight: make(),
    language: make(),
  };
  for (const preset of BUSINESS_TYPE_PRESETS) {
    addChips(idx.service, preset.suggestedServices);
    addChips(idx.reason, preset.reasonsToChoose);
    addChips(idx.quickFact, preset.quickFacts);
  }
  addChips(idx.highlight, BUSINESS_HIGHLIGHT_PRESET_CHIPS);
  addChips(idx.language, LANGUAGE_OPTION_CHIPS);
  // `buildServiciosLanguageLabels` renders `lang_otro` without a custom line as this pair.
  addChips(idx.language, [{ id: "lang_otro_label", es: "Otro idioma", en: "Other language" }]);
  CHIP_INDEX = idx;
  return idx;
}

function businessTypeLabels(): Map<string, BusinessTypeLabelEntry> {
  if (BUSINESS_TYPE_LABELS) return BUSINESS_TYPE_LABELS;
  const map = new Map<string, BusinessTypeLabelEntry>();
  for (const preset of BUSINESS_TYPE_PRESETS) {
    const entry = { id: preset.id, es: preset.labelEs, en: preset.labelEn };
    for (const label of [preset.labelEs, preset.labelEn]) {
      const key = normLabel(label);
      if (key && !map.has(key)) map.set(key, entry);
    }
  }
  BUSINESS_TYPE_LABELS = map;
  return map;
}

/**
 * The catalog chip (id + both labels) behind a preset reference: by id first, then by either-locale
 * label. Null when the reference is owner-authored.
 */
export function canonicalPresetChip(
  kind: ServiciosCanonicalChipKind,
  ref: { id?: string | null; label?: string | null },
): ChipDef | null {
  const idx = chipIndex()[kind];
  const chip =
    (ref.id ? idx.byId.get(ref.id) : undefined) ??
    (ref.label ? idx.byLabel.get(normLabel(ref.label)) : undefined);
  return chip ?? null;
}

export function canonicalPresetLabel(
  kind: ServiciosCanonicalChipKind,
  ref: { id?: string | null; label: string },
  target: ServiciosLang,
): string | null {
  const chip = canonicalPresetChip(kind, ref);
  if (!chip) return null;
  return target === "en" ? chip.en : chip.es;
}

/** The business-type preset (id + both labels) behind a category line, or null when it is custom. */
export function canonicalBusinessTypeEntry(label: string): BusinessTypeLabelEntry | null {
  return businessTypeLabels().get(normLabel(label)) ?? null;
}

/** Both catalog labels of a business-type category line, or null when it is custom. */
export function canonicalBusinessTypeLabels(label: string): { es: string; en: string } | null {
  const entry = canonicalBusinessTypeEntry(label);
  return entry ? { es: entry.es, en: entry.en } : null;
}

/** The catalog label of a business-type category line in `target`, or null when it is custom. */
export function canonicalBusinessTypeLabel(label: string, target: ServiciosLang): string | null {
  const pair = canonicalBusinessTypeLabels(label);
  return pair ? (target === "en" ? pair.en : pair.es) : null;
}
