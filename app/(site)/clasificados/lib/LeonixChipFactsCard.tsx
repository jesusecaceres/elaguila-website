import type { ComponentType } from "react";

/**
 * Item 16 — shared compact chip-list card for property highlights/characteristics/included
 * services. One card, one title, N chips. Category adapters (BR Privado/Negocio, Rentas
 * Privado/Negocio, ...) build the `items` array from their own canonical + custom values — this
 * component owns no category logic. Sparse by construction: renders nothing when `items` is
 * empty, matching LeonixListingFactsGrid's own contract.
 */

export type LeonixChipFactsCardTheme = {
  borderColor: string;
  cardBackground: string;
  titleColor: string;
  chipBorderColor: string;
  chipBackground: string;
  chipTextColor: string;
};

export function LeonixChipFactsCard({
  title,
  items,
  theme,
  icon: Icon,
  className,
  /** When true, skip this component's own card border/title chrome and render only the chip
   * row — for callers (e.g. Rentas' <Section eyebrow/title>) that already supply their own
   * heading/wrapper and just want the shared chip-row presentation underneath it. */
  bare = false,
}: {
  title: string;
  items: readonly string[] | undefined;
  theme: LeonixChipFactsCardTheme;
  /** Optional leading icon rendered inside each chip (e.g. a checkmark). */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  className?: string;
  bare?: boolean;
}) {
  const safeItems = (Array.isArray(items) ? items : []).map((v) => String(v ?? "").trim()).filter(Boolean);
  if (!safeItems.length) return null;

  const chipRow = (
    <div className="flex flex-wrap gap-2">
      {safeItems.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
          style={{ borderColor: theme.chipBorderColor, background: theme.chipBackground, color: theme.chipTextColor }}
        >
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
          {item}
        </span>
      ))}
    </div>
  );

  if (bare) return chipRow;

  return (
    <div
      className={`min-w-0 rounded-xl border p-3.5 sm:p-4 ${className ?? ""}`}
      style={{ borderColor: theme.borderColor, background: theme.cardBackground }}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: theme.titleColor }}>
        {title}
      </h3>
      <div className="mt-3">{chipRow}</div>
    </div>
  );
}
