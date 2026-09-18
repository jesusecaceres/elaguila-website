/**
 * Learning Center — shared class tokens (Phase 1). Mirrors the Home launch vocabulary
 * (ivory/cream field, burgundy CTA, deep-green headings, olive eyebrows, gold accents, existing
 * `font-serif`) so /aprender reads as the same product as /home. No new fonts, no new gradients.
 */
export const LEARNING_CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export const LEARNING_EYEBROW = "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]";
export const LEARNING_EYEBROW_BURGUNDY = "text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]";
export const LEARNING_H2 = "mt-2 max-w-2xl font-serif text-[1.75rem] font-bold leading-snug text-[#2A4536] sm:text-[2rem]";
export const LEARNING_INTRO = "mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base";

export const LEARNING_FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]";

export const LEARNING_BTN_PRIMARY = `inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721] ${LEARNING_FOCUS_RING} sm:text-[0.9375rem]`;
export const LEARNING_BTN_OUTLINE = `inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-7 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] ${LEARNING_FOCUS_RING} sm:text-[0.9375rem]`;
/** Text-style link that still meets the 44 px touch target. */
export const LEARNING_LINK = `inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-bold text-[#7A1E2C] underline-offset-4 hover:underline ${LEARNING_FOCUS_RING}`;

/** Slim link tile (landing tools row): comfortably above the 44 px touch target. */
export const LEARNING_TOOL_TILE = `group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7] p-4 shadow-[0_10px_28px_-22px_rgba(31,36,28,0.3)] transition hover:border-[#C9A84A]/70 ${LEARNING_FOCUS_RING}`;

export const LEARNING_SECTION = "scroll-mt-24";

/** Per-category editorial tint (glyph + panel). Unknown keys fall back to the neutral cream tint. */
export type LearningTint = { panel: string; ring: string; ink: string; glyph: string };

export const LEARNING_TINTS: Record<string, LearningTint> = {
  burgundy: { panel: "bg-[#7A1E2C]/[0.07]", ring: "ring-[#7A1E2C]/20", ink: "text-[#7A1E2C]", glyph: "bg-[#7A1E2C] text-[#F8F4EA]" },
  green: { panel: "bg-[#2A4536]/[0.08]", ring: "ring-[#2A4536]/20", ink: "text-[#2A4536]", glyph: "bg-[#2A4536] text-[#F3D98A]" },
  olive: { panel: "bg-[#556B3E]/[0.10]", ring: "ring-[#556B3E]/25", ink: "text-[#3F5230]", glyph: "bg-[#556B3E] text-[#F8F4EA]" },
  gold: { panel: "bg-[#C9A84A]/[0.16]", ring: "ring-[#C9A84A]/35", ink: "text-[#7A5A12]", glyph: "bg-[#C9A84A] text-[#1E1810]" },
  sand: { panel: "bg-[#E8DFD0]/60", ring: "ring-[#D6C7AD]", ink: "text-[#5C5346]", glyph: "bg-[#5C5346] text-[#F8F4EA]" },
};

export const LEARNING_CATEGORY_TINT: Record<string, keyof typeof LEARNING_TINTS> = {
  fundamentos_del_negocio: "green",
  clientes_y_demanda: "burgundy",
  dinero_y_capacidad: "gold",
  visibilidad_y_publicidad: "olive",
  comunicacion_y_reputacion: "burgundy",
  proteccion_y_datos: "sand",
};

export function tintForCategory(categoryKey: string): LearningTint {
  return LEARNING_TINTS[LEARNING_CATEGORY_TINT[categoryKey] ?? "sand"];
}

export function lessonsCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
