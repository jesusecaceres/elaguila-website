"use client";

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getArticuloLabel, departmentLabel } from "../shared/fields/enVentaTaxonomy";

type Lang = "es" | "en";

type CardListing = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  hasImage?: boolean;
  images?: string[];
  evDept?: string;
  evSub?: string;
  itemType?: string;
  conditionKey?: string;
  condition?: string;
};

function conditionChip(key: string | undefined, lang: Lang): string | null {
  const k = (key ?? "").trim().toLowerCase();
  const map: Record<string, { es: string; en: string }> = {
    new: { es: "Nuevo", en: "New" },
    "like-new": { es: "Como nuevo", en: "Like new" },
    good: { es: "Bueno", en: "Good" },
    fair: { es: "Regular", en: "Fair" },
  };
  const hit = map[k];
  if (hit) return hit[lang];
  const legacy = (key ?? "").trim();
  return legacy || null;
}

export function EnVentaListaCard({
  x,
  lang,
  isFav,
  onToggleFav,
  href,
  previewMode,
}: {
  x: CardListing;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  href: string;
  previewMode?: boolean;
}) {
  const hero = Array.isArray(x.images) && x.images[0] ? x.images[0] : null;
  const dept = (x.evDept ?? "").trim();
  const article = (x.itemType ?? "").trim();
  const subline =
    dept && article
      ? `${departmentLabel(dept, lang)} · ${getArticuloLabel(dept, article, lang)}`
      : dept
        ? departmentLabel(dept, lang)
        : "";
  const cond = conditionChip(x.conditionKey ?? x.condition, lang);

  const shellClass =
    "group relative block overflow-hidden rounded-2xl border border-black/10 bg-[#F5F5F5] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)]";

  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E8E8]">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : x.hasImage ? (
          <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#111111]/25">
            <span className="text-4xl" aria-hidden>
              📦
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFav(x.id);
          }}
          className="absolute right-2 top-2 z-10 rounded-full border border-black/10 bg-white/95 p-2 shadow-sm hover:bg-white"
          aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : lang === "es" ? "Guardar" : "Save"}
        >
          {isFav ? "★" : "☆"}
        </button>
      </div>

      <div className="space-y-1.5 p-3 sm:p-4">
        <div className="text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl">
          {formatListingPrice(x.priceLabel[lang], { lang })}
        </div>
        {cond ? (
          <span className="inline-flex rounded-full border border-[#C9B46A]/50 bg-[#FAF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#111111]">
            {cond}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#111111]">{x.title[lang]}</h3>
        {subline ? <p className="text-xs text-[#111111]/65">{subline}</p> : null}
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-[#111111]/80">
          <span>{x.city}</span>
          <span className="text-[#111111]/40">·</span>
          <span className="text-xs">{x.postedAgo[lang]}</span>
        </div>
        {!previewMode ? (
          <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-[#111111] group-hover:underline">
            {lang === "es" ? "Ver anuncio" : "View listing"}
            <span aria-hidden>→</span>
          </span>
        ) : (
          <span className="pt-1 text-xs font-medium text-[#111111]/50">{lang === "es" ? "Vista previa" : "Preview"}</span>
        )}
      </div>
    </>
  );

  if (previewMode) {
    return <div className={shellClass}>{body}</div>;
  }

  return (
    <a href={href} className={shellClass}>
      {body}
    </a>
  );
}
