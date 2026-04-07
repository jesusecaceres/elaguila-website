/**
 * Formats detail pairs into the description appendix block (publish / preview).
 * Pure string assembly — no category logic.
 */

export type PublishLang = "es" | "en";

export function buildDetailsAppendixFromPairs(
  pairs: Array<{ label: string; value: string }>,
  lang: PublishLang
): string {
  if (!pairs.length) return "";
  const header = lang === "es" ? "Detalles" : "Details";
  const lines = pairs.map((p) => `${p.label}: ${p.value}`).join("\n");
  return `\n\n—\n${header}:\n${lines}`.trim();
}
