import Image from "next/image";
import Link from "next/link";
import type { ServiciosLandingFeaturedBusiness } from "./serviciosLandingSampleData";

function Stars({ rating }: { rating: number }) {
  const n = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <div className="flex items-center gap-0.5 text-[#EA580C]" aria-label={`${rating.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-[16px] leading-none">
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export function FeaturedBusinessCard({ row, lang }: { row: ServiciosLandingFeaturedBusiness; lang: "es" | "en" }) {
  const ctaClass =
    row.cta.kind === "call"
      ? "inline-flex min-h-[42px] min-w-[120px] items-center justify-center gap-2 rounded-xl border border-[#1a3352]/18 bg-white px-4 text-[13px] font-bold text-[#1a3352] shadow-[0_4px_14px_-8px_rgba(26,51,82,0.35)] transition hover:border-[#1a3352]/30 hover:bg-[#fafcff]"
      : "inline-flex min-h-[42px] min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-4 text-[13px] font-bold text-white shadow-[0_10px_26px_-12px_rgba(194,65,12,0.5)] transition hover:brightness-[1.04]";

  const ctaInner =
    row.cta.kind === "call" && row.cta.telHref ? (
      <a href={row.cta.telHref} className={ctaClass}>
        <span aria-hidden>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {row.cta.labelEs}
      </a>
    ) : (
      <Link
        href={`${row.cta.detailHref ?? "/clasificados/servicios/resultados"}?lang=${lang}`}
        className={ctaClass}
      >
        {row.cta.labelEs}
      </Link>
    );

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e5ddd2]/90 bg-white shadow-[0_26px_58px_-38px_rgba(20,38,58,0.48)] ring-2 ring-[#C9A84A]/20 ring-offset-2 ring-offset-[#faf6ef] transition duration-300 hover:-translate-y-1 hover:ring-[#C9A84A]/35 hover:shadow-[0_32px_70px_-36px_rgba(20,38,58,0.52)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-[20px] bg-gradient-to-r from-[#C9A84A]/90 via-[#E8D5A3] to-[#C9A84A]/90" aria-hidden />
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e8e4dc]">
        <Image
          src={row.coverImageSrc}
          alt={row.coverImageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 32vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#1a2f4a]/25 via-transparent to-transparent opacity-80"
          aria-hidden
        />
        {row.featured ? (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            <span className="rounded-full border border-white/50 bg-black/35 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/95 backdrop-blur-sm">
              {lang === "en" ? "Preferred placement" : "Espacio preferente"}
            </span>
            <span className="rounded-full border border-white/40 bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_6px_16px_-6px_rgba(194,65,12,0.65)]">
              {lang === "en" ? "Featured" : "Destacado"}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5a6b7c]">{row.categoryLabelEs}</p>
        <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-[#142a42]">{row.businessName}</h3>
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <Stars rating={row.rating} />
          <span className="text-[14px] font-bold tabular-nums text-[#142a42]">{row.rating.toFixed(1)}</span>
          <span className="text-[12px] text-[#64748b]">({row.reviewCount})</span>
        </div>
        <p className="mt-4 flex items-start gap-2 border-t border-[#ebe4d9]/90 pt-4 text-[13px] leading-snug text-[#3d4f62]">
          <span className="mt-0.5 shrink-0 text-[#3d5a73]" aria-hidden>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
          </span>
          <span>
            {row.city}
            {row.zipOrArea ? ` · ${row.zipOrArea}` : ""}
          </span>
        </p>
        <div className="mt-auto flex justify-end pt-5">{ctaInner}</div>
      </div>
    </article>
  );
}
