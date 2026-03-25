"use client";

import Link from "next/link";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { getArticuloLabel, departmentLabel } from "../shared/fields/enVentaTaxonomy";

export type Lang = "es" | "en";

export type EnVentaResultCardListing = {
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

function HeroImage({
  hero,
  hasImage,
  layout,
}: {
  hero: string | null;
  hasImage?: boolean;
  layout: "grid" | "list";
}) {
  const inner =
    hero != null ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={hero} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
    ) : hasImage ? (
      <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-[#2C2416]/20">
        <span className="text-4xl" aria-hidden>
          📦
        </span>
      </div>
    );

  if (layout === "list") {
    return (
      <div className="relative h-[160px] w-40 shrink-0 overflow-hidden bg-[#EDE6DC] sm:h-[172px] sm:w-48">
        {inner}
      </div>
    );
  }

  return <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EDE6DC]">{inner}</div>;
}

export function EnVentaResultListingCard({
  x,
  lang,
  isFav,
  onToggleFav,
  href,
  layout = "grid",
  promotedLabel,
}: {
  x: EnVentaResultCardListing;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  href: string;
  layout?: "grid" | "list";
  promotedLabel?: string;
}) {
  const hero = Array.isArray(x.images) && x.images[0] ? x.images[0] : null;
  const thumbs = Array.isArray(x.images) ? x.images.slice(0, 5) : [];
  const dept = (x.evDept ?? "").trim();
  const article = (x.itemType ?? "").trim();
  const subline =
    dept && article
      ? `${departmentLabel(dept, lang)} · ${getArticuloLabel(dept, article, lang)}`
      : dept
        ? departmentLabel(dept, lang)
        : "";
  const cond = conditionChip(x.conditionKey ?? x.condition, lang);

  const shell =
    "group relative block overflow-hidden rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 shadow-[0_10px_36px_-14px_rgba(42,36,22,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4C4A8]/80 hover:shadow-[0_18px_48px_-14px_rgba(201,180,106,0.22)]";

  const favBtn = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFav(x.id);
      }}
      className="absolute right-2 top-2 z-10 rounded-full border border-[#E8DFD0] bg-white/95 p-2 text-[#5C5346] shadow-sm hover:bg-white"
      aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : lang === "es" ? "Guardar" : "Save"}
    >
      {isFav ? "★" : "☆"}
    </button>
  );

  const meta = (
    <div className={layout === "list" ? "flex min-w-0 flex-1 flex-col justify-center space-y-1.5 p-4 sm:p-5" : "space-y-1.5 p-3 sm:p-4"}>
      {promotedLabel ? (
        <span className="inline-flex w-fit rounded-full border border-[#C9B46A]/50 bg-gradient-to-r from-[#FAF4EA] to-[#F0E6D4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C4A22]">
          {promotedLabel}
        </span>
      ) : null}
      <div className="text-xl font-extrabold tracking-tight text-[#1E1810] sm:text-2xl">
        {formatListingPrice(x.priceLabel[lang], { lang })}
      </div>
      {cond ? (
        <span className="inline-flex w-fit rounded-full border border-[#C9B46A]/45 bg-[#FAF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2C2416]">
          {cond}
        </span>
      ) : null}
      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#1E1810]">{x.title[lang]}</h3>
      {subline ? <p className="text-xs text-[#5C5346]/90">{subline}</p> : null}
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-[#3D3428]/90">
        <span>{x.city}</span>
        <span className="text-[#3D3428]/35">·</span>
        <span className="text-xs">{x.postedAgo[lang]}</span>
      </div>
      <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-[#2A2620] group-hover:underline">
        {lang === "es" ? "Ver anuncio" : "View listing"}
        <span aria-hidden>→</span>
      </span>
      {layout === "grid" && thumbs.length > 1 ? (
        <div className="flex gap-1 pt-1">
          {thumbs.slice(0, 4).map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${u}-${i}`} src={u} alt="" className="h-9 w-9 rounded-md border border-[#E8DFD0] object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );

  const imageSection = (
    <div className="relative shrink-0">
      <HeroImage hero={hero} hasImage={x.hasImage} layout={layout} />
      {favBtn}
    </div>
  );

  if (layout === "list") {
    return (
      <Link href={href} className={`${shell} flex flex-row`}>
        {imageSection}
        {meta}
      </Link>
    );
  }

  return (
    <Link href={href} className={shell}>
      {imageSection}
      {meta}
    </Link>
  );
}
