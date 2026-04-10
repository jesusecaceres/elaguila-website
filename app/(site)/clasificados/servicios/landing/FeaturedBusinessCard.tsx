import Image from "next/image";
import Link from "next/link";
import type { ServiciosLandingFeaturedBusiness } from "./serviciosLandingSampleData";

function Stars({ rating }: { rating: number }) {
  const n = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <div className="flex items-center gap-0.5 text-[#EA580C]" aria-label={`${rating.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-[15px] leading-none">
          {i < n ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

export function FeaturedBusinessCard({ row, lang }: { row: ServiciosLandingFeaturedBusiness; lang: "es" | "en" }) {
  const ctaClass =
    row.cta.kind === "call"
      ? "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#1e3a5f]/20 bg-white px-4 text-[13px] font-bold text-[#1e3a5f] shadow-sm transition hover:border-[#1e3a5f]/35"
      : "inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-4 text-[13px] font-bold text-white shadow-md transition hover:brightness-[1.03]";

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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E2D8] bg-[#FFFCF7] shadow-[0_16px_40px_-24px_rgba(30,52,78,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-22px_rgba(30,52,78,0.38)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#E8E4DC]">
        <Image
          src={row.coverImageSrc}
          alt={row.coverImageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {row.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#EA580C] to-[#C2410C] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
            Destacado
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5b6b7b]">{row.categoryLabelEs}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-[#1a2f4a]">{row.businessName}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Stars rating={row.rating} />
          <span className="text-[13px] font-semibold tabular-nums text-[#1a2f4a]">{row.rating.toFixed(1)}</span>
          <span className="text-[12px] text-[#64748b]">({row.reviewCount})</span>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-[#475569]">
          <span className="mt-0.5 shrink-0 text-[#4A6678]" aria-hidden>
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
        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#E8E2D8]/80 pt-4">
          {ctaInner}
        </div>
      </div>
    </article>
  );
}
