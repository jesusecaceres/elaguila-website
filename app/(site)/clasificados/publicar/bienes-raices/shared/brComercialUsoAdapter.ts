/**
 * Item 85/86 — BR Negocio Comercial "Uso comercial" structured chip catalog + custom-add adapter
 * for the shared LanguagesInput primitive (`@/app/components/forms/LanguagesInput`), mirroring
 * the already-proven `brRentasLanguagesAdapter.ts` pattern.
 *
 * Storage stays the existing single free-text `comercialUso: string` field — additive-only, no
 * schema/type change, no downstream (mapper/preview/publish/live-detail) file needs to change.
 * This only replaces the plain `<input>` with structured preset chips + a controlled custom-add
 * area, and parses/serializes the same comma-separated string shape on read/save.
 */

export type BrComercialUsoPresetKey =
  | "retail"
  | "oficina"
  | "estudio"
  | "medico"
  | "restaurante"
  | "taller"
  | "almacen"
  | "otro";

export const BR_COMERCIAL_USO_OTHER_KEY: BrComercialUsoPresetKey = "otro";

const BR_COMERCIAL_USO_PRESETS: {
  key: BrComercialUsoPresetKey;
  labelEs: string;
  labelEn: string;
  aliases: string[];
}[] = [
  { key: "retail", labelEs: "Comercio minorista", labelEn: "Retail", aliases: ["comercio minorista", "retail"] },
  { key: "oficina", labelEs: "Oficina profesional", labelEn: "Professional office", aliases: ["oficina profesional", "oficina", "professional office", "office"] },
  { key: "estudio", labelEs: "Estudio", labelEn: "Studio", aliases: ["estudio", "studio"] },
  { key: "medico", labelEs: "Médico / clínica", labelEn: "Medical / clinic", aliases: ["médico / clínica", "medico / clinica", "médico", "medico", "clínica", "clinica", "medical / clinic", "medical"] },
  { key: "restaurante", labelEs: "Restaurante", labelEn: "Restaurant", aliases: ["restaurante", "restaurant"] },
  { key: "taller", labelEs: "Taller ligero", labelEn: "Light workshop", aliases: ["taller ligero", "taller", "light workshop", "workshop"] },
  { key: "almacen", labelEs: "Almacén / bodega", labelEn: "Warehouse", aliases: ["almacén / bodega", "almacen / bodega", "almacén", "almacen", "bodega", "warehouse"] },
  { key: "otro", labelEs: "Otro", labelEn: "Other", aliases: [] },
];

export function brComercialUsoChipOptions(lang: "es" | "en"): { key: string; label: string }[] {
  return BR_COMERCIAL_USO_PRESETS.map((p) => ({ key: p.key, label: lang === "es" ? p.labelEs : p.labelEn }));
}

function presetKeyForToken(token: string): BrComercialUsoPresetKey | null {
  const norm = token.trim().toLowerCase();
  if (!norm) return null;
  for (const p of BR_COMERCIAL_USO_PRESETS) {
    if (p.key === "otro") continue;
    if (p.aliases.includes(norm)) return p.key;
  }
  return null;
}

/** Splits the stored comma-separated string into recognized preset keys + leftover custom entries. */
export function parseBrComercialUsoString(raw: string): { selectedKeys: string[]; customValues: string[] } {
  const tokens = String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const selected = new Set<string>();
  const custom: string[] = [];
  for (const token of tokens) {
    const key = presetKeyForToken(token);
    if (key) selected.add(key);
    else custom.push(token);
  }
  if (custom.length) selected.add(BR_COMERCIAL_USO_OTHER_KEY);
  return { selectedKeys: [...selected], customValues: custom };
}

/** Serializes preset selection + custom entries back into the same comma-separated string format. */
export function serializeBrComercialUsoString(
  selectedKeys: string[],
  customValues: string[],
  lang: "es" | "en",
): string {
  const parts: string[] = [];
  for (const p of BR_COMERCIAL_USO_PRESETS) {
    if (p.key === "otro") continue;
    if (selectedKeys.includes(p.key)) parts.push(lang === "es" ? p.labelEs : p.labelEn);
  }
  parts.push(...customValues);
  return parts.join(", ");
}
