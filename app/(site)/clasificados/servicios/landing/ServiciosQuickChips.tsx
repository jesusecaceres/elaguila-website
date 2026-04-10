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
    <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
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
                ? "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#1e3a5f]/25 bg-white/90 px-4 py-2 text-[13px] font-semibold text-[#1e3a5f] shadow-sm transition hover:border-[#1e3a5f]/40 hover:bg-white"
                : "inline-flex min-h-[40px] items-center rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-semibold text-[#F8FAFC] shadow-[0_6px_18px_-10px_rgba(30,58,95,0.55)] transition hover:bg-[#172f4d] hover:brightness-[1.02] active:scale-[0.99]"
            }
          >
            {isMore ? (
              <>
                <span aria-hidden className="grid h-5 w-5 place-items-center rounded-md border border-[#1e3a5f]/30 bg-white/80 text-[11px]">
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
  );
}
