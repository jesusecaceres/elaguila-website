import Image from "next/image";
import Link from "next/link";
import type { ServiciosLandingRecentListing } from "./serviciosLandingSampleData";

export function RecentServiceCard({ row, lang }: { row: ServiciosLandingRecentListing; lang: "es" | "en" }) {
  const btn =
    row.cta.kind === "call" && row.cta.telHref ? (
      <a
        href={row.cta.telHref}
        className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#1e3a5f]/18 bg-white px-4 text-[13px] font-bold text-[#1e3a5f] shadow-sm transition hover:border-[#1e3a5f]/30"
      >
        {row.cta.labelEs}
      </a>
    ) : (
      <Link
        href={`${row.cta.detailHref ?? "/clasificados/servicios/resultados"}?lang=${lang}`}
        className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-4 text-[13px] font-bold text-white shadow-md transition hover:brightness-[1.03]"
      >
        {row.cta.labelEs}
      </Link>
    );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white shadow-[0_12px_32px_-20px_rgba(30,52,78,0.3)]">
      <div className="relative aspect-[16/9] w-full bg-[#E8E4DC]">
        <Image
          src={row.coverImageSrc}
          alt={row.coverImageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">{row.businessNameEs}</p>
        <h3 className="mt-1 text-[17px] font-bold leading-snug text-[#1a2f4a]">{row.serviceTitleEs}</h3>
        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#475569]">{row.descriptionEs}</p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E8E2D8]/90 pt-4">
          <span className="text-[13px] font-semibold tabular-nums text-[#1a2f4a]">★ {row.rating.toFixed(1)}</span>
          {btn}
        </div>
      </div>
    </article>
  );
}
