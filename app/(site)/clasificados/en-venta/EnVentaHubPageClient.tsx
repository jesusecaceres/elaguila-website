"use client";

import Image from "next/image";
import Link from "next/link";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { useSearchParams } from "next/navigation";
import { buildEnVentaResultsUrl } from "./shared/constants/enVentaResultsRoutes";
import type { EnVentaDepartmentKey } from "./taxonomy/categories";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";
import { enVentaPublicLabel } from "./shared/constants/enVentaPublicLabels";
import type { EnVentaHubLandingResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import type { EnVentaPublicBrowseListing } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import { EN_VENTA_HUB_CITY_PRESETS } from "./enVentaHubCityPresets";
import { DEFAULT_CITY } from "@/app/data/locations/norcal";
import { CategoryStandardLandingBlock } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome";
import {
  categoryStandardSearchPlaceholder,
  categoryStandardTitle,
  categoryStandardDescription,
  CATEGORY_STANDARD_PAGE_BG,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { EnVentaHubRecentListings } from "./hub/EnVentaHubRecentListings";
import { EnVentaHubHorizontalScroll } from "./hub/EnVentaHubHorizontalScroll";
import { EnVentaHubMoreFilters } from "./hub/EnVentaHubMoreFilters";

/** Default hero: welcoming outdoor marketplace / promenade (no lion). Muted blues in scene; Unsplash license. */
const DEFAULT_HERO_BACKDROP =
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2400&q=82";

/** Emoji + optional cool (muted blue) icon plate for category balance. */
const DEPT_VISUAL: Record<EnVentaDepartmentKey, { icon: string; cool?: boolean }> = {
  electronicos: { icon: "📱" },
  hogar: { icon: "🏠" },
  muebles: { icon: "🛋️" },
  "ropa-accesorios": { icon: "👕" },
  "bebes-ninos": { icon: "🧸" },
  herramientas: { icon: "🔧" },
  "vehiculos-partes": { icon: "🚗", cool: true },
  deportes: { icon: "⚽", cool: true },
  "juguetes-juegos": { icon: "🎲" },
  coleccionables: { icon: "🏺" },
  "musica-foto-video": { icon: "🎸" },
  otros: { icon: "⭐" },
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Lang = "es" | "en";

function HeroBackdrop({ src }: { src: string }) {
  const useNextImage = src.startsWith("/") || src.includes("images.unsplash.com");
  /** Responsive focal point: slightly higher on phones, centered on desktop — reduces awkward crops. */
  const objectPos =
    "pointer-events-none select-none object-cover object-[center_35%] min-[400px]:object-[center_38%] md:object-[center_40%] xl:object-[center_42%]";
  if (useNextImage) {
    return (
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1152px"
        className={objectPos}
      />
    );
  }
  return (
     
    <img src={src} alt="" className={`absolute inset-0 h-full w-full ${objectPos}`} />
  );
}

function TrustIconGift({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7V20M12 7H7.5a2.5 2.5 0 010-5H9a3 3 0 013 3 3 3 0 013-3h1.5a2.5 2.5 0 010 5H12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 11h8v9H8v-9z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function TrustIconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9.5 12.5l1.75 1.75L15 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrustIconPeople({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 20v-1.5A3.5 3.5 0 016.5 15H9M21 20v-1.5A3.5 3.5 0 0017.5 15H15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EnVentaHubPageClient({
  hub,
  initialLiveListings,
}: {
  hub: EnVentaHubLandingResolved;
  initialLiveListings: EnVentaPublicBrowseListing[];
}) {
  const sp = useSearchParams();
  const routeLang = normalizeLang(sp?.get("lang"));
  const lang: Lang = navCopyLang(routeLang);

  const publishHref = replaceLangInHref("/clasificados/publicar/en-venta", routeLang);
  const allListingsHref = buildEnVentaResultsUrl(routeLang as Lang);
  const hrefBrowseNewest = buildEnVentaResultsUrl(routeLang as Lang, { sort: "newest" });
  const hrefBrowseNear = buildEnVentaResultsUrl(routeLang as Lang, { city: DEFAULT_CITY });
  const hrefBrowseShip = buildEnVentaResultsUrl(routeLang as Lang, { ship: "1" });
  const hrefBrowsePickup = buildEnVentaResultsUrl(routeLang as Lang, { pickup: "1" });
  /** Featured-only browse: `featured=1` matches Pro listings inside an active post-republish visibility window (`republished_at`). */
  /** `featured=1` = listings whose visibility window from `republished_at` is still open (Pro renewed visibility), not mock inventory. */
  const hrefBrowseFeatured = buildEnVentaResultsUrl(routeLang as Lang, { featured: "1" });
  const hrefSellerIndividual = buildEnVentaResultsUrl(routeLang as Lang, { seller: "individual" });
  const hrefSellerBusiness = buildEnVentaResultsUrl(routeLang as Lang, { seller: "business" });

  const t = hub;
  const backdropSrc = t.heroImageUrl?.trim() ? t.heroImageUrl.trim() : DEFAULT_HERO_BACKDROP;

  const goldBtn =
    "inline-flex min-h-[48px] min-w-[44px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-[#1E1810] " +
    "bg-gradient-to-br from-[#F0D78C] via-[#D4A03E] to-[#C18A2E] shadow-[0_10px_28px_-8px_rgba(196,140,50,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] " +
    "transition hover:brightness-[1.04] active:scale-[0.99]";

  const ivoryBtn =
    "inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border border-white/80 bg-[#FFFCF7] px-6 text-[15px] font-semibold text-[#2C2416] " +
    "shadow-[0_8px_24px_-10px_rgba(42,36,22,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:bg-white active:scale-[0.99]";

  const chipNeutral =
    "inline-flex min-h-[44px] max-w-full items-center justify-center text-balance rounded-full border border-[#E8DFD0] bg-white/95 px-3 py-2 text-center text-[12px] font-semibold leading-snug text-[#2C2416] shadow-[0_2px_8px_-2px_rgba(47,74,101,0.08)] transition hover:border-[#C9B46A]/45 hover:bg-white hover:shadow-[0_4px_14px_-4px_rgba(47,74,101,0.12)] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:px-3.5 sm:text-[13px]";
  const chipFeaturedCls =
    "inline-flex min-h-[44px] max-w-full items-center gap-1.5 justify-center text-balance rounded-full border border-[#C9A84A]/45 bg-gradient-to-br from-[#FFFBF0] via-[#F5F8FB] to-[#E8EEF3] px-3 py-2 text-center text-[12px] font-semibold leading-tight text-[#2F4A65] shadow-[0_4px_16px_-6px_rgba(201,168,74,0.35)] ring-1 ring-[#C9A84A]/25 transition hover:ring-[#C9A84A]/40 focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:px-4 sm:text-[13px]";

  const popularCategoryChips: Array<{ key: string; label: string; href: string }> = [
    {
      key: "electronicos",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "electronicos")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "electronicos" }),
    },
    {
      key: "hogar",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "hogar")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "hogar" }),
    },
    {
      key: "muebles",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "muebles")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "muebles" }),
    },
    {
      key: "ropa",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "ropa-accesorios")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "ropa-accesorios" }),
    },
    {
      key: "deportes",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "deportes")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "deportes" }),
    },
  ];

  const quickFilterChips: Array<{ key: string; label: string; href: string; featured?: boolean }> = [
    { key: "newest", label: t.browseChipNewest, href: hrefBrowseNewest },
    { key: "near", label: t.browseChipNear, href: hrefBrowseNear },
    { key: "free", label: lang === "es" ? "Gratis / regalo" : "Free / gift", href: buildEnVentaResultsUrl(routeLang as Lang, { free: "1" }) },
    { key: "pickup", label: t.browseChipPickup, href: hrefBrowsePickup },
    { key: "ship", label: t.browseChipShip, href: hrefBrowseShip },
    { key: "featured", label: t.browseChipFeatured, href: hrefBrowseFeatured, featured: true },
  ];

  const swipeHint = lang === "es" ? "Desliza →" : "Swipe →";

  const enVentaSearchForm = (
    <div className="w-full min-w-0 space-y-2 text-left">
      <form action="/clasificados/en-venta/results" method="get" role="search">
        <input type="hidden" name="lang" value={routeLang} />
        <div
          className={cx(
            "flex flex-col gap-0 overflow-hidden rounded-xl border border-[#D6C7AD] bg-white shadow-[0_4px_18px_-14px_rgba(31,36,28,0.12)]",
            "sm:grid sm:grid-cols-12 sm:items-stretch",
          )}
        >
          <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 px-3 sm:col-span-5">
            <span className="shrink-0 text-[#556B3E]" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              name="q"
              type="search"
              autoComplete="off"
              placeholder={categoryStandardSearchPlaceholder("en-venta", lang)}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            />
          </label>
          <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 border-t border-[#D6C7AD] px-3 sm:col-span-3 sm:border-l sm:border-t-0">
            <input
              name="city"
              type="text"
              list="en-venta-hub-city-presets"
              placeholder={t.cityPh}
              aria-label={t.cityPh}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            />
            <datalist id="en-venta-hub-city-presets">
              {EN_VENTA_HUB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 border-t border-[#D6C7AD] px-3 sm:col-span-2 sm:border-l sm:border-t-0">
            <span className="text-[#4A6678]" aria-hidden>
              #
            </span>
            <input
              name="zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder={lang === "es" ? "CP / ZIP" : "ZIP"}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            />
          </label>
          <div className="border-t border-[#D6C7AD] p-1.5 sm:col-span-2 sm:border-l sm:border-t-0">
            <button
              type="submit"
              className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
            >
              {t.search}
            </button>
          </div>
        </div>
      </form>
      <div className="mt-3 space-y-3">
        <EnVentaHubHorizontalScroll
          label={lang === "es" ? "Categorías populares" : "Popular categories"}
          swipeHint={swipeHint}
        >
          {popularCategoryChips.map((chip) => (
            <Link key={chip.key} href={chip.href} className={`${chipNeutral} shrink-0 snap-start`}>
              {chip.label}
            </Link>
          ))}
        </EnVentaHubHorizontalScroll>

        <div className="flex flex-wrap items-center gap-2">
          <EnVentaHubMoreFilters lang={lang} routeLang={routeLang} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${CATEGORY_STANDARD_PAGE_BG} text-[#1F241C]`}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <main className="relative mx-auto w-full min-w-0 max-w-[min(100%,90rem)] px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-20 sm:pt-5 md:px-6 lg:px-10 lg:pt-6 xl:px-14">
        <CategoryStandardLandingBlock
          category="en-venta"
          lang={lang}
          eyebrow={t.badge}
          title={categoryStandardTitle("en-venta", lang)}
          description={categoryStandardDescription("en-venta", lang)}
          searchAction="/clasificados/en-venta/results"
          searchPlaceholder={categoryStandardSearchPlaceholder("en-venta", lang)}
          publishHref={publishHref}
          browseHref={allListingsHref}
          publishLabel={t.publish}
          browseLabel={t.lista}
          searchSlot={enVentaSearchForm}
        />

        <EnVentaHubRecentListings
          listings={initialLiveListings}
          lang={lang}
          allListingsHref={allListingsHref}
          allListingsLabel={t.lista}
        />

        <section className="mt-5 sm:mt-6" aria-label={lang === "es" ? "Filtros rápidos" : "Quick filters"}>
          <EnVentaHubHorizontalScroll
            label={lang === "es" ? "Filtros rápidos" : "Quick filters"}
            swipeHint={swipeHint}
          >
            {quickFilterChips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className={chip.featured ? `${chipFeaturedCls} shrink-0 snap-start` : `${chipNeutral} shrink-0 snap-start`}
              >
                {chip.featured ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 text-[#B8891A]" aria-hidden fill="currentColor">
                    <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
                  </svg>
                ) : null}
                {chip.label}
              </Link>
            ))}
          </EnVentaHubHorizontalScroll>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-[#5C5346] sm:text-[12px]">{t.exposureHint}</p>
        </section>

        {/* Categories — compact horizontal on mobile */}
        <section className="mt-6 sm:mt-8">
          <h2 className="text-center font-serif text-[1.25rem] font-bold tracking-tight text-[#1E1810] sm:text-2xl">
            {t.categoriesTitle}
          </h2>
          <div className="mt-4 sm:mt-6">
            <EnVentaHubHorizontalScroll
              label={lang === "es" ? "Todas las categorías" : "All categories"}
              swipeHint={swipeHint}
              className="sm:hidden"
            >
              {EN_VENTA_DEPARTMENTS.map((d) => {
                const href = buildEnVentaResultsUrl(routeLang as Lang, { evDept: d.key });
                const title = d.label[lang];
                const vis = DEPT_VISUAL[d.key];
                return (
                  <Link
                    key={d.key}
                    href={href}
                    className="flex w-[min(42vw,160px)] shrink-0 snap-start flex-col items-center rounded-[16px] border border-white/70 bg-[#FFFCF7]/95 p-3 text-center shadow-sm transition hover:border-[#C9B46A]/38"
                  >
                    <span className="text-2xl" aria-hidden>{vis.icon}</span>
                    <span className="mt-2 text-[12px] font-bold leading-tight text-[#1E1810]">{title}</span>
                  </Link>
                );
              })}
            </EnVentaHubHorizontalScroll>
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {EN_VENTA_DEPARTMENTS.map((d) => {
                const href = buildEnVentaResultsUrl(routeLang as Lang, { evDept: d.key });
                const title = d.label[lang];
                const hint = d.browseHint[lang];
                const vis = DEPT_VISUAL[d.key];
                const cool = vis.cool;

                return (
                  <Link
                    key={d.key}
                    href={href}
                    className={cx(
                      "group flex min-h-[136px] flex-col items-center rounded-[20px] border border-white/70 bg-[#FFFCF7]/95 p-3.5 text-center shadow-[0_12px_36px_-16px_rgba(47,74,101,0.2)] ring-1 ring-transparent transition sm:min-h-[140px] sm:p-4",
                      "hover:-translate-y-0.5 hover:border-[#C9B46A]/38 hover:shadow-[0_20px_48px_-14px_rgba(201,180,106,0.26)] hover:ring-[#C9B46A]/22",
                      "focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
                    )}
                  >
                    <span
                      className={cx(
                        "mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-inner transition group-hover:scale-[1.04]",
                        cool
                          ? "border border-[#D4E0EA]/90 bg-gradient-to-br from-[#EEF3F7] to-[#E2EBF2] text-[#2F4A65]"
                          : "border border-[#F0E8D8] bg-gradient-to-br from-[#FFF9EE] to-[#F3E9D4]"
                      )}
                      aria-hidden
                    >
                      {vis.icon}
                    </span>
                    <span className="text-[14px] font-bold leading-tight text-[#1E1810] min-[420px]:text-[15px]">{title}</span>
                    <span className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[#5C5346] min-[420px]:text-[12px] sm:text-[13px]">{hint}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust — horizontal strip on mobile */}
        <section className="mt-6 sm:mt-8" aria-label={lang === "es" ? "Confianza y seguridad" : "Trust and safety"}>
          <div className="rounded-[22px] border border-white/75 bg-[#FFFCF7]/90 px-3 py-4 shadow-[0_10px_36px_-16px_rgba(42,36,22,0.14)] sm:px-6 sm:py-6">
            <EnVentaHubHorizontalScroll
              label={lang === "es" ? "Compra con confianza" : "Shop with confidence"}
              swipeHint={swipeHint}
              className="sm:hidden"
            >
              {[
                { icon: TrustIconGift, title: t.trust1Title, sub: t.trust1Sub, warm: true },
                { icon: TrustIconShield, title: t.trust2Title, sub: t.trust2Sub, warm: false },
                { icon: TrustIconPeople, title: t.trust3Title, sub: t.trust3Sub, warm: true },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex w-[min(78vw,260px)] shrink-0 snap-start flex-col rounded-2xl border border-[#E8DFD0]/80 bg-white/60 p-4 text-left"
                >
                  <span
                    className={cx(
                      "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                      card.warm
                        ? "bg-gradient-to-br from-[#FFF3D6] to-[#E8C96A]/50 text-[#B8891A]"
                        : "bg-gradient-to-br from-[#E8EEF3] to-[#D4E0EA]/70 text-[#2F4A65]"
                    )}
                  >
                    <card.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-[14px] font-bold text-[#1E1810]">{card.title}</h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#3d556b]">{card.sub}</p>
                </div>
              ))}
            </EnVentaHubHorizontalScroll>
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3D6] to-[#E8C96A]/50 text-[#B8891A]">
                  <TrustIconGift className="h-6 w-6" />
                </span>
                <h3 className="text-[16px] font-bold text-[#1E1810]">{t.trust1Title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#3d556b] sm:text-sm">{t.trust1Sub}</p>
              </div>
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8EEF3] to-[#D4E0EA]/70 text-[#2F4A65]">
                  <TrustIconShield className="h-6 w-6" />
                </span>
                <h3 className="text-[16px] font-bold text-[#1E1810]">{t.trust2Title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#3d556b] sm:text-sm">{t.trust2Sub}</p>
              </div>
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF3D6] to-[#E8C96A]/45 text-[#B8891A]">
                  <TrustIconPeople className="h-6 w-6" />
                </span>
                <h3 className="text-[16px] font-bold text-[#1E1810]">{t.trust3Title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#3d556b] sm:text-sm">{t.trust3Sub}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seller trust + publish CTA */}
        <section className="mt-6 sm:mt-8">
          <div className="rounded-[20px] border border-white/70 bg-[#FFFCF7]/92 px-4 py-4 shadow-[0_6px_24px_-14px_rgba(47,74,101,0.12)] sm:px-5 sm:py-5">
            <p className="text-center text-[14px] leading-snug text-[#2C2416] sm:text-[15px] sm:leading-relaxed">{t.sellerTrust}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={hrefSellerIndividual}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#D4E0EA] bg-[#F5F8FB] px-5 text-[13px] font-semibold text-[#2F4A65] transition hover:bg-[#E8EEF3] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              >
                {t.sellerLinkInd}
              </Link>
              <Link
                href={hrefSellerBusiness}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#D4E0EA] bg-[#F5F8FB] px-5 text-[13px] font-semibold text-[#2F4A65] transition hover:bg-[#E8EEF3] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              >
                {t.sellerLinkBiz}
              </Link>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[13px] leading-relaxed text-[#4A6678] sm:text-sm">{t.handoff}</p>
          </div>
        </section>

        {/* Bottom sell CTA */}
        <section className="mt-6 sm:mt-8">
          <div className="flex flex-col items-start justify-between gap-5 rounded-[24px] border border-white/75 bg-[#FFFCF7]/95 px-5 py-7 shadow-[0_16px_48px_-20px_rgba(47,74,101,0.18)] sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:py-10">
            <div className="min-w-0 max-w-xl flex-1">
              <h2 className="font-serif text-[1.15rem] font-bold text-[#1E1810] sm:text-2xl">{t.bottomSellTitle}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#3d556b] sm:text-base">{t.bottomSellSub}</p>
            </div>
            <Link
              href={publishHref}
              className={cx(goldBtn, "w-full shrink-0 px-8 shadow-[0_12px_32px_-10px_rgba(196,140,50,0.45)] sm:w-auto")}
            >
              {t.bottomSellCta}
            </Link>
          </div>
        </section>

        {process.env.NEXT_PUBLIC_EV_INTERNAL_QA === "1" ? (
          <p className="mt-8 text-center text-[11px] text-[#7A7164]">
            <Link href={replaceLangInHref("/clasificados/en-venta/launch-checklist", routeLang)} className="font-semibold underline underline-offset-2">
              {lang === "es" ? "Checklist interno de lanzamiento (QA)" : "Internal launch checklist (QA)"}
            </Link>
          </p>
        ) : null}
      </main>

      {/* Mobile: persistent publish + browse — high visibility without duplicating full hero labels */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/96 shadow-[0_-10px_40px_-12px_rgba(42,36,22,0.18)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="navigation"
        aria-label={lang === "es" ? "Acciones rápidas" : "Quick actions"}
      >
        <div className="mx-auto flex max-w-[min(100%,90rem)] gap-2 px-3 py-2.5">
          <Link
            href={publishHref}
            className={cx(goldBtn, "min-h-[48px] flex-1 justify-center px-4 text-[15px] font-semibold")}
          >
            {t.mobileStickyPublish}
          </Link>
          <Link
            href={allListingsHref}
            className={cx(ivoryBtn, "min-h-[48px] flex-1 justify-center px-4 text-[15px] font-semibold")}
          >
            {t.mobileStickyBrowse}
          </Link>
        </div>
      </div>
    </div>
  );
}
