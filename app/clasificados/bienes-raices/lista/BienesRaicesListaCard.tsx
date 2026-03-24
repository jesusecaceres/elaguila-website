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

export function BienesRaicesListaCard(props: {
  listing: BienesRaicesListaListingLike;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  href: string;
}) {
  const { listing: x, lang, isFav, onToggleFav, href } = props;
  const m = buildBienesRaicesListaCardModel(x, lang);

  const cardShell = m.isNegocio
    ? m.brPlanTier === "business_plus"
      ? "border-[#C9B46A]/45 bg-white shadow-[0_4px_20px_-6px_rgba(17,17,17,0.12)] ring-1 ring-[#C9B46A]/20"
      : "border-[#C9B46A]/30 bg-[#FFFCF9] shadow-sm ring-1 ring-[#C9B46A]/12"
    : "border-stone-200/90 bg-white shadow-sm ring-1 ring-stone-100";

  const topAccent = m.isNegocio
    ? m.brPlanTier === "business_plus"
      ? "h-[3px] bg-gradient-to-r from-transparent via-[#C9B46A]/80 to-transparent"
      : "h-[2px] bg-gradient-to-r from-transparent via-[#C9B46A]/45 to-transparent"
    : "h-[2px] bg-gradient-to-r from-transparent via-emerald-800/25 to-transparent";

  return (
    <a
      href={href}
      className={cx(
        "group relative block overflow-hidden rounded-2xl border text-left transition-all duration-200 ease-out",
        "hover:shadow-[0_10px_28px_-10px_rgba(17,17,17,0.18)] hover:-translate-y-0.5",
        cardShell
      )}
    >
      <div aria-hidden className={cx("pointer-events-none absolute inset-x-0 top-0 z-10", topAccent)} />

      <div
        className={cx(
          "relative aspect-[4/3] w-full overflow-hidden",
          m.isNegocio ? "bg-[#F4F1EB]" : "bg-stone-100"
        )}
      >
        {m.heroUrl ? (
          <img
            src={m.heroUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : x.hasImage ? (
          <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-[#111111]/25" aria-hidden>
            🏠
          </div>
        )}
        {(m.mediaCount > 1 || m.hasProVideo) && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-[2px]">
            {m.mediaCount > 1 && m.hasProVideo
              ? `${m.mediaCount} ${lang === "es" ? "fotos" : "photos"} · ${lang === "es" ? "Video" : "Video"}`
              : m.mediaCount > 1
                ? `${m.mediaCount} ${lang === "es" ? "fotos" : "photos"}`
                : lang === "es"
                  ? "Video"
                  : "Video"}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav(x.id);
            }}
            className="rounded-full bg-white/95 p-2 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40"
            aria-label={
              isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")
            }
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
        {m.isSold && (
          <div className="absolute left-2 top-2 rounded-md border border-red-200/80 bg-red-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-50">
            {lang === "es" ? "Vendido" : "Sold"}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {m.isNegocio ? (
            <>
              {m.brPlanTier === "business_plus" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#C9B46A]/50 bg-[#FAF3E4] px-2 py-0.5 text-[10px] font-semibold text-[#5C4D1F]">
                  {lang === "es" ? "Profesional Plus" : "Pro Plus"}
                </span>
              )}
              {m.brPlanTier === "business_standard" && (
                <span className="inline-flex items-center rounded-full border border-[#C9B46A]/35 bg-[#FFFCF6] px-2 py-0.5 text-[10px] font-semibold text-[#4A4536]">
                  {lang === "es" ? "Profesional" : "Professional"}
                </span>
              )}
            </>
          ) : (
            <span className="inline-flex items-center rounded-full border border-emerald-800/20 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-950">
              {lang === "es" ? "Propietario" : "Owner"}
            </span>
          )}
          {m.approximateLocation && (
            <span className="inline-flex items-center rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-950">
              {lang === "es" ? "Ubicación aprox." : "Approx. location"}
            </span>
          )}
        </div>

        <div className="mt-2 font-extrabold text-lg text-[#111111] tabular-nums sm:text-xl">
          {formatListingPrice(x.priceLabel[lang], { lang })}
        </div>

        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-[#111111] sm:text-[1.05rem]">
          {x.title[lang]}
        </h3>

        <div className="mt-1 text-sm font-medium text-[#111111]/90">{x.city}</div>
        {m.locationSecondary ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-[#111111]/65">{m.locationSecondary}</p>
        ) : null}

        {m.quickFacts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.quickFacts.map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className={cx(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-[11px]",
                  m.isNegocio
                    ? "border-[#C9B46A]/28 bg-[#FAF3E4]/80 text-[#111111]"
                    : "border-stone-200/90 bg-stone-50 text-[#111111]"
                )}
              >
                <span aria-hidden>{p.icon}</span>
                <span className="text-[#111111]/55">{p.label}:</span>
                {p.value}
              </span>
            ))}
          </div>
        )}

        {m.highlightChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {m.highlightChips.slice(0, 3).map((h, i) => (
              <span
                key={`${h}-${i}`}
                className={cx(
                  "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                  m.isNegocio ? "border-[#C9B46A]/25 bg-white text-[#3D3420]" : "border-stone-200 bg-white text-stone-800"
                )}
              >
                {h}
              </span>
            ))}
          </div>
        )}

        <p className="mt-2 line-clamp-2 text-sm leading-snug text-[#111111]/80">{x.blurb[lang]}</p>

        {m.isNegocio && (m.businessName || m.agentName || m.brokerageName) && (
          <div className="mt-2 flex flex-col gap-0.5 text-xs text-[#111111]/80">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {m.businessName ? <span className="max-w-[220px] truncate font-semibold text-[#111111]">{m.businessName}</span> : null}
              {m.agentName ? <span className="max-w-[180px] truncate text-[#111111]/70">{m.agentName}</span> : null}
            </div>
            {m.brokerageName ? (
              <span className="max-w-full truncate text-[11px] text-[#111111]/60">
                {lang === "es" ? "Correduría" : "Brokerage"}: {m.brokerageName}
              </span>
            ) : null}
          </div>
        )}

        {m.trustCaption ? (
          <p className={cx("mt-1.5 text-[11px] font-medium", m.isNegocio ? "text-[#5C4D1F]/90" : "text-emerald-900/80")}>{m.trustCaption}</p>
        ) : null}

        <div className="mt-1 text-[11px] text-[#111111]/50">{x.postedAgo[lang]}</div>

        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#2F4A33] group-hover:underline">
          {lang === "es" ? "Ver anuncio" : "View listing"}
          <span className="opacity-70">→</span>
        </span>
      </div>
    </a>
  );
}
