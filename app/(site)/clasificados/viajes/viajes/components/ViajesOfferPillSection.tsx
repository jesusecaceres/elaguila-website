import type { ViajesPillItem } from "../lib/v2/viajesOfferModelV2";

export function ViajesOfferPillSection({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: ViajesPillItem[] | string[];
  tone?: "default" | "exclude" | "highlight";
}) {
  const labels = items
    .map((item) => (typeof item === "string" ? item.trim() : item.label.trim()))
    .filter(Boolean);
  if (!labels.length) return null;

  const chip =
    tone === "exclude"
      ? "border-rose-200 bg-rose-50/70 text-rose-950"
      : tone === "highlight"
        ? "border-amber-200 bg-amber-50/70 text-amber-950"
        : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)]";

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/70 shadow-sm">
      <div className="border-b border-[color:var(--lx-nav-border)]/60 px-5 py-4 sm:px-8">
        <h2 className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
      </div>
      <ul className="flex flex-wrap gap-2 p-5 sm:p-8">
        {labels.map((label) => (
          <li key={label} className={`inline-flex rounded-full border px-3 py-2 text-sm font-medium shadow-sm ${chip}`}>
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
