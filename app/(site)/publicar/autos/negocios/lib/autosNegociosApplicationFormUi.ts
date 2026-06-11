/** Shared form layout tokens — main Autos Negocios application + inventory-child drawer. */
export const AUTOS_NEGOCIOS_FORM_CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-6";
export const AUTOS_NEGOCIOS_FORM_LABEL =
  "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
export const AUTOS_NEGOCIOS_FORM_INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
export const AUTOS_NEGOCIOS_FORM_GRID2 =
  "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4";

export function autosNegociosReqLabel(label: string) {
  return label;
}

export function parseAutosNegociosOptInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : undefined;
}
