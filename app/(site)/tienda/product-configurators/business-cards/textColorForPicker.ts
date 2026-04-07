/**
 * Maps stored CSS colors to a 6-digit hex for `<input type="color">` + hex text fields.
 * Opaque hex in / opaque hex out keeps the picker honest; rgba loses alpha when converted.
 */

export function businessCardTextColorToHex(value: string): string {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const s = v.slice(1);
    const r = s[0]! + s[0]!;
    const g = s[1]! + s[1]!;
    const b = s[2]! + s[2]!;
    return `#${r}${g}${b}`.toLowerCase();
  }
  const rgba = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgba) {
    const r = Math.min(255, Math.max(0, Math.round(Number(rgba[1]))));
    const g = Math.min(255, Math.max(0, Math.round(Number(rgba[2]))));
    const b = Math.min(255, Math.max(0, Math.round(Number(rgba[3]))));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  if (v === "var(--lx-text)" || v.includes("--lx-text")) return "#2c2416";
  return "#2c2416";
}

export function parseHexInput(raw: string): string | null {
  const s = raw.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{3}$/.test(s) && !/^[0-9A-Fa-f]{6}$/.test(s)) return null;
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return `#${full.toLowerCase()}`;
}

/** True when rgba alpha is below 1 — swatch/hex replace with a solid tone. */
export function colorIsTranslucentOrNonHex(value: string): boolean {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(v) || /^#[0-9A-Fa-f]{6}$/.test(v)) return false;
  if (v.startsWith("var(")) return false;
  if (v.startsWith("rgb(") && !v.startsWith("rgba(")) return false;
  const m = v.match(/^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/i);
  if (m) return Number(m[1]) < 1;
  return false;
}
