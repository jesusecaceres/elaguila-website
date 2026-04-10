import Link from "next/link";
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
    <div className="mx-auto max-w-[920px]">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3d5a73]/80">
        {lang === "en" ? "Popular services" : "Servicios populares"}
      </p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3">
        {chips.map((c) => {
          const isMore = c.id === "more";
          const href = isMore
            ? `${base}?lang=${lang}`
            : c.resultsGroup
              ? `${base}?lang=${lang}&group=${encodeURIComponent(c.resultsGroup)}`
              : `${base}?lang=${lang}`;

          return (
            <Link
              key={c.id}
              href={href}
              className={
                isMore
                  ? "inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[#1e3a5f]/22 bg-white px-4 py-2 text-[13px] font-semibold text-[#1e3a5f] shadow-[0_4px_14px_-6px_rgba(30,58,95,0.35)] transition hover:border-[#1e3a5f]/35 hover:bg-[#fafcff] active:scale-[0.99]"
                  : "inline-flex min-h-[42px] items-center rounded-full bg-[#1a3352] px-4 py-2 text-[13px] font-semibold text-[#F8FAFC] shadow-[0_8px_22px_-12px_rgba(26,51,82,0.55)] transition hover:bg-[#152a45] hover:brightness-[1.02] active:scale-[0.99]"
              }
            >
              {isMore ? (
                <>
                  <span aria-hidden className="grid h-5 w-5 place-items-center rounded-md border border-[#1e3a5f]/22 bg-white/90 text-[11px] text-[#1e3a5f]">
                    ⧉
                  </span>
                  {c.labelEs}
                </>
              ) : (
                c.labelEs
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
