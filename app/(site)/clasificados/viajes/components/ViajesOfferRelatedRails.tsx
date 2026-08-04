import Link from "next/link";
import type { ViajesResultRow } from "../data/viajesResultsSampleData";
import { viajesResultCardTitle } from "../lib/viajesProviderMatch";

function RelatedCard({ row, lang }: { row: ViajesResultRow; lang: "es" | "en" }) {
  const title = viajesResultCardTitle(row);
  const image = row.imageSrc;
  const dest =
    row.kind === "editorial" ? row.destinationLabel : row.kind === "business" ? row.destination : row.destination;
  const price =
    row.kind === "business" ? row.price : row.kind === "affiliate" ? row.priceFrom : "";
  return (
    <li className="min-w-[240px] max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm">
      <Link href={row.href} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-[color:var(--lx-section)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={row.imageAlt || title} className="h-full w-full object-cover" />
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-bold text-[color:var(--lx-text)]">{title}</p>
          {dest ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{dest}</p> : null}
          {price ? <p className="mt-1 text-xs font-semibold text-[color:var(--lx-text-2)]">{price}</p> : null}
          <span className="mt-2 inline-flex text-xs font-bold text-[color:var(--lx-burgundy)]">
            {lang === "en" ? "View offer" : "Ver oferta"} →
          </span>
        </div>
      </Link>
    </li>
  );
}

export function ViajesOfferMoreFromProvider({
  rows,
  lang = "es",
}: {
  rows: ViajesResultRow[];
  lang?: "es" | "en";
}) {
  if (!rows.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
        {lang === "en" ? "More trips from this provider" : "Más viajes de este proveedor"}
      </h2>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {rows.map((row) => (
          <RelatedCard key={row.id} row={row} lang={lang} />
        ))}
      </ul>
    </section>
  );
}

export function ViajesOfferSimilarGetaways({
  rows,
  lang = "es",
}: {
  rows: ViajesResultRow[];
  lang?: "es" | "en";
}) {
  if (!rows.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
        {lang === "en" ? "Similar Leonix getaways" : "Escapadas similares en Leonix"}
      </h2>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {rows.map((row) => (
          <RelatedCard key={row.id} row={row} lang={lang} />
        ))}
      </ul>
    </section>
  );
}
