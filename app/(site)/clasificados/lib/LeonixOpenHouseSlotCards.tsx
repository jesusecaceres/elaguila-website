/**
 * Shared structured Open House / Visitas Programadas renderer (Final Completion item 05).
 *
 * Renders 1-N slots, each as its own mini-card of label:value rows (date, hours, additional
 * days/hours, notes) — never a single joined text blob. Supports BR Privado's single slot and
 * BR Negocio's up to 4 slots with the same component. Sparse: a slot with zero rows is not
 * rendered, and the whole block renders nothing when there are no slots at all.
 */

export type LeonixOpenHouseRow = { label: string; value: string };

export function LeonixOpenHouseSlotCards({
  title,
  slots,
  borderColor,
  cardBackground,
  labelColor,
  valueColor,
}: {
  title: string;
  slots: LeonixOpenHouseRow[][];
  borderColor: string;
  cardBackground: string;
  labelColor: string;
  valueColor: string;
}) {
  const nonEmptySlots = slots.filter((rows) => rows.length > 0);
  if (!nonEmptySlots.length) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: labelColor }}>
        {title}
      </h4>
      <div className={`grid gap-2 ${nonEmptySlots.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {nonEmptySlots.map((rows, i) => (
          <div key={i} className="rounded-lg border px-3 py-2.5" style={{ borderColor, background: cardBackground }}>
            <ul className="space-y-1 text-sm">
              {rows.map((r) => (
                <li key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-1.5">
                  <span className="font-semibold" style={{ color: valueColor }}>
                    {r.label}:
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]" style={{ color: valueColor }}>
                    {r.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
