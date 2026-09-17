"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical identity/detail meta grid.
 *
 * Renders whatever real label/value pairs the category adapter supplies — it does not decide
 * which fields exist for a category. Omit an item rather than pass a placeholder; this
 * component never fabricates a value for a missing field.
 */
export type OwnerEntityDetailItem = {
  label: string;
  value: string;
  /** UI Completion Gate — most values here are short (slug, a formatted date, a ref) and
   * `truncate` safely never triggers. A few real values (e.g. Autos Dealer's "X de Y vehículos
   * activos" / "Te quedan N espacios disponibles" capacity lines) are full sentences that can
   * clip at 390px in a 2-column cell. Set `wide` for those so the cell spans the full row
   * instead of truncating business-critical text. Defaults to false — every existing caller is
   * unaffected. */
  wide?: boolean;
};

export function OwnerEntityDetailGrid({ items }: { items: OwnerEntityDetailItem[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={item.wide ? "col-span-full min-w-0" : "min-w-0"}>
          <dt className="font-semibold uppercase tracking-wide text-[#7A7164]">{item.label}</dt>
          <dd className={item.wide ? "mt-0.5 text-[#1E1810]" : "mt-0.5 truncate text-[#1E1810]"}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
