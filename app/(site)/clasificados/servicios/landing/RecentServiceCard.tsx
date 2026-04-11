import Image from "next/image";
import Link from "next/link";
import type { ServiciosLandingRecentListing } from "./serviciosLandingSampleData";

export function RecentServiceCard({ row, lang }: { row: ServiciosLandingRecentListing; lang: "es" | "en" }) {
  const btnBase = "inline-flex min-h-[42px] min-w-[112px] items-center justify-center rounded-xl text-[13px] font-bold transition";

  const btn =
    row.cta.kind === "call" && row.cta.telHref ? (
      <a
        href={row.cta.telHref}
        className={`${btnBase} border border-[#1a3352]/16 bg-white text-[#1a3352] shadow-[0_4px_14px_-8px_rgba(26,51,82,0.3)] hover:border-[#1a3352]/28`}
      >
        {row.cta.label}
      </a>
    ) : (
      <Link
        href={`${row.cta.detailHref ?? "/clasificados/servicios/resultados"}?lang=${lang}`}
        className={`${btnBase} bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white shadow-[0_10px_26px_-12px_rgba(194,65,12,0.45)] hover:brightness-[1.04]`}
      >
        {row.cta.label}
      </Link>
    );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#e5ddd2]/90 bg-[#faf8f5] shadow-[0_18px_44px_-32px_rgba(20,38,58,0.4)] ring-1 ring-[#1e3a5f]/[0.03]">
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-[#e5e1da]">
        <Image
          src={row.coverImageSrc}
          alt={row.coverImageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 32vw"
          className="object-cover"
        />
        {row.sellerPresentation ? (
          <span
            className={
              row.sellerPresentation === "business"
                ? "absolute left-2 top-2 rounded-full bg-[#1a3352]/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                : "absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#142a42] shadow-sm ring-1 ring-[#e5ddd2]"
            }
          >
            {row.sellerPresentation === "business"
              ? lang === "en"
                ? "Business"
                : "Negocio"
              : lang === "en"
                ? "Independent"
                : "Independiente"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{row.businessName}</p>
        <h3 className="mt-2 text-[17px] font-bold leading-snug tracking-tight text-[#142a42] sm:text-lg">{row.serviceTitle}</h3>
        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#3d4f62]">{row.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e8e0d6]/90 pt-5">
          {typeof row.rating === "number" ? (
            <span className="text-[13px] font-bold tabular-nums text-[#142a42]">
              <span className="text-[#EA580C]" aria-hidden>
                ★{" "}
              </span>
              {row.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[12px] font-medium text-[#64748b]">
              {lang === "en" ? "Published showcase" : "Vitrina publicada"}
            </span>
          )}
          {btn}
        </div>
      </div>
    </article>
  );
}
