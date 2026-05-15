import Link from "next/link";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import type { ServiciosQuickChip } from "./serviciosLandingSampleData";

export function ServiciosQuickChips({
  lang,
  chips,
}: {
  lang: "es" | "en";
  chips: ServiciosQuickChip[];
}) {
  const base = "/clasificados/servicios/resultados";

  return (
    <div className="mx-auto w-full max-w-[min(100%,920px)] px-0 sm:px-0">
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3d5a73]/80 sm:mb-3 sm:text-[11px]">
        {lang === "en" ? "Popular services" : "Servicios populares"}
      </p>
      <CategoryLandingChipsRail
        label={lang === "en" ? "Popular service shortcuts" : "Atajos de servicios populares"}
      >
        {chips.map((c) => {
          const isMore = c.id === "more";
          const label = lang === "en" ? c.labelEn : c.labelEs;
          const qRaw = (lang === "en" ? c.resultsQueryEn : c.resultsQueryEs).trim();
          const href = isMore
            ? `${base}?lang=${lang}`
            : c.resultsGroup
              ? `${base}?lang=${lang}&group=${encodeURIComponent(c.resultsGroup)}`
              : qRaw
                ? `${base}?lang=${lang}&q=${encodeURIComponent(qRaw)}`
                : `${base}?lang=${lang}`;

          return (
            <Link
              key={c.id}
              href={href}
              className={
                isMore
                  ? "inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border border-[#1e3a5f]/22 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#1e3a5f] shadow-[0_4px_14px_-6px_rgba(30,58,95,0.35)] transition hover:border-[#1e3a5f]/35 hover:bg-[#fafcff] active:scale-[0.99] sm:px-4 sm:text-[13px]"
                  : "inline-flex min-h-[44px] shrink-0 snap-start items-center rounded-full bg-[#1a3352] px-3.5 py-2 text-[12px] font-semibold text-[#F8FAFC] shadow-[0_8px_22px_-12px_rgba(26,51,82,0.55)] transition hover:bg-[#152a45] hover:brightness-[1.02] active:scale-[0.99] sm:px-4 sm:text-[13px]"
              }
            >
              {isMore ? (
                <>
                  <span aria-hidden className="grid h-5 w-5 place-items-center rounded-md border border-[#1e3a5f]/22 bg-white/90 text-[11px] text-[#1e3a5f]">
                    ⧉
                  </span>
                  {label}
                </>
              ) : (
                label
              )}
            </Link>
          );
        })}
      </CategoryLandingChipsRail>
    </div>
  );
}
