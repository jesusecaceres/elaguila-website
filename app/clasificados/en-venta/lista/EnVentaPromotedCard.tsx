"use client";

import { EnVentaListaCard } from "./EnVentaListaCard";

/** Hook for future boosts: subtle ring + label; same data as free card. */
export function EnVentaPromotedCard(
  props: Parameters<typeof EnVentaListaCard>[0] & { promoted?: boolean }
) {
  const { promoted, lang, ...cardProps } = props;
  return (
    <div
      className={
        promoted
          ? "rounded-2xl p-[1px] bg-gradient-to-br from-yellow-400/70 via-[#C9B46A]/40 to-transparent"
          : ""
      }
    >
      <div className={promoted ? "rounded-2xl bg-[#F5F5F5]" : ""}>
        {promoted ? (
          <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[#111111]/60">
            {lang === "es" ? "Destacado" : "Promoted"}
          </div>
        ) : null}
        <EnVentaListaCard {...cardProps} lang={lang} />
      </div>
    </div>
  );
}
