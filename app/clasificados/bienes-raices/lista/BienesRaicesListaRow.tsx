"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import {
  brListaPrimaryBranchBadge,
  buildBienesRaicesListaCardModel,
  type BienesRaicesListaListingLike,
} from "@/app/clasificados/bienes-raices/lista/brListaCardModel";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Lang = "es" | "en";

export function BienesRaicesListaRow(props: {
  listing: BienesRaicesListaListingLike;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  href: string;
  withImg: boolean;
}) {
  const { listing: x, lang, isFav, onToggleFav, href, withImg } = props;
  const m = buildBienesRaicesListaCardModel(x, lang);

  const rowBorder = m.isNegocio
    ? m.brPlanTier === "business_plus"
      ? "border-[#C9B46A]/40 bg-[#FFFCF9] ring-1 ring-[#C9B46A]/15"
      : "border-[#C9B46A]/25 bg-[#FFFCF9]/90"
    : "border-stone-200/90 bg-white";

  return (
    <div
      className={cx(
        "group relative flex items-stretch gap-3 overflow-hidden rounded-2xl border p-2.5 sm:p-3 transition-all duration-200 ease-out",
        "hover:-translate-y-[1px] hover:shadow-md",
        rowBorder
      )}
    >
      <div
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-x-0 top-0 h-0.5",
          m.isNegocio ? "bg-gradient-to-r from-transparent via-[#C9B46A]/50 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-800/20 to-transparent"
        )}
      />

      {withImg ? (
        <a href={href} className="relative shrink-0 overflow-hidden rounded-xl border border-black/10 bg-stone-100 sm:h-24 sm:w-32 h-20 w-28">
          {m.heroUrl ? (
            <img src={m.heroUrl} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
          ) : x.hasImage ? (
            <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-[#111111]/20">🏠</div>
          )}
          {m.isSold && (
            <span className="absolute left-1 top-1 rounded bg-red-950/90 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
              {lang === "es" ? "Vendido" : "Sold"}
            </span>
          )}
        </a>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <a href={href} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cx(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  m.isNegocio ? "border-[#C9B46A]/45 bg-[#FAF3E4] text-[#5C4D1F]" : "border-emerald-800/22 bg-emerald-50 text-emerald-950"
                )}
              >
                {brListaPrimaryBranchBadge(lang, m)}
              </span>
              {m.approximateLocation && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-950">
                  {lang === "es" ? "Aprox." : "Approx."}
                </span>
              )}
            </div>
            <div className="mt-1 text-lg font-extrabold tabular-nums text-[#111111]">
              {formatListingPrice(x.priceLabel[lang], { lang })}
            </div>
            <div className="line-clamp-2 text-base font-semibold leading-snug text-[#111111]">{x.title[lang]}</div>
            <div className="mt-0.5 text-sm text-[#111111]/85">{x.city}</div>
            {m.locationSecondary ? (
              <div className="line-clamp-1 text-xs text-[#111111]/60">{m.locationSecondary}</div>
            ) : null}
            {m.quickFacts.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {m.quickFacts.slice(0, 4).map((p, i) => (
                  <span
                    key={`${p.label}-${i}`}
                    className={cx(
                      "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      m.isNegocio ? "border-[#C9B46A]/25 bg-[#FAF3E4]/70" : "border-stone-200 bg-stone-50"
                    )}
                  >
                    <span aria-hidden>{p.icon}</span>
                    {p.value}
                  </span>
                ))}
              </div>
            )}
            {m.highlightChips.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.highlightChips.slice(0, 2).map((h, i) => (
                  <span key={i} className="rounded border border-stone-200/80 bg-white px-1.5 py-0.5 text-[10px] text-stone-700">
                    {h}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 line-clamp-2 text-sm text-[#111111]/75">{x.blurb[lang]}</p>
            {m.isNegocio && (m.businessName || m.agentName || m.brokerageName) && (
              <p className="mt-1 line-clamp-2 text-xs text-[#111111]/75">
                {[m.businessName, m.agentName].filter(Boolean).join(" · ")}
                {m.brokerageName ? ` · ${lang === "es" ? "Correduría" : "Brokerage"}: ${m.brokerageName}` : ""}
              </p>
            )}
            {m.trustCaption ? (
              <p className={cx("mt-1 text-[11px] font-medium", m.isNegocio ? "text-[#5C4D1F]/85" : "text-emerald-900/75")}>{m.trustCaption}</p>
            ) : null}
            <div className="mt-1 text-[11px] text-[#111111]/50">{x.postedAgo[lang]}</div>
          </a>
          <button
            type="button"
            onClick={() => onToggleFav(x.id)}
            className="shrink-0 rounded-full border border-black/10 bg-white/90 p-1.5 text-sm shadow-sm hover:bg-white"
            aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar" : "Save")}
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
        <a
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#2F4A33] hover:underline"
        >
          {lang === "es" ? "Ver anuncio" : "View listing"} →
        </a>
      </div>
    </div>
  );
}
