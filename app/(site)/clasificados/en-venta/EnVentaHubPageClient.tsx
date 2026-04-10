"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildEnVentaResultsUrl } from "./shared/constants/enVentaResultsRoutes";
import type { EnVentaDepartmentKey } from "./taxonomy/categories";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";
import type { EnVentaHubLandingResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { EN_VENTA_HUB_CITY_PRESETS } from "./enVentaHubCityPresets";
import { DEFAULT_CITY } from "@/app/data/locations/norcal";

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
    "object-cover object-[center_35%] min-[400px]:object-[center_38%] md:object-[center_40%] xl:object-[center_42%]";
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
    // eslint-disable-next-line @next/next/no-img-element -- admin may set arbitrary HTTPS hero URLs not in `images.remotePatterns`
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

export function EnVentaHubPageClient({ hub }: { hub: EnVentaHubLandingResolved }) {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const publishHref = `/clasificados/publicar/en-venta?lang=${lang}`;
  const allListingsHref = buildEnVentaResultsUrl(lang);
  const hrefBrowseNewest = buildEnVentaResultsUrl(lang, { sort: "newest" });
  const hrefBrowseNear = buildEnVentaResultsUrl(lang, { city: DEFAULT_CITY });
  const hrefBrowseShip = buildEnVentaResultsUrl(lang, { ship: "1" });
  const hrefBrowsePickup = buildEnVentaResultsUrl(lang, { pickup: "1" });
  /** Featured-only browse: `featured=1` matches active `boost_expires` (Pro visibility). */
  const hrefBrowseFeatured = buildEnVentaResultsUrl(lang, { featured: "1" });
  const hrefSellerIndividual = buildEnVentaResultsUrl(lang, { seller: "individual" });
  const hrefSellerBusiness = buildEnVentaResultsUrl(lang, { seller: "business" });

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

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-[#2C2416]"
      style={{
        backgroundColor: "#F3EBDD",
        backgroundImage: `
          radial-gradient(ellipse 120% 70% at 50% -15%, rgba(201, 180, 106, 0.16), transparent 55%),
          radial-gradient(ellipse 50% 40% at 100% 20%, rgba(255, 255, 255, 0.4), transparent 50%),
          radial-gradient(ellipse 45% 35% at 0% 80%, rgba(61, 90, 115, 0.06), transparent 52%)
        `,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <main className="relative mx-auto w-full min-w-0 max-w-6xl px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-24 sm:pt-9 md:px-6 lg:px-8 lg:pt-10">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[24px] border border-white/50 bg-[#E8E0D4]/40 shadow-[0_24px_80px_-32px_rgba(47,74,101,0.35)] sm:rounded-[28px] md:rounded-[32px]">
          <div className="absolute inset-0 min-h-[240px] sm:min-h-[260px] md:min-h-[280px] lg:min-h-[300px]">
            <HeroBackdrop src={backdropSrc} />
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#F8F1E4]/86 via-[#F5EFE3]/74 to-[#F3EBDD]/92 max-md:from-[#F8F1E4]/88"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#3D5A73]/[0.07] via-transparent to-[#3D5A73]/[0.05]"
              aria-hidden
            />
            <div
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F3EBDD] via-[#F3EBDD]/94 to-transparent sm:h-32 md:h-40"
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center px-3 pb-7 pt-5 text-center sm:max-w-none sm:px-6 sm:pb-11 sm:pt-9 md:px-8 md:pb-12 md:pt-11 lg:pb-14 lg:pt-12">
            <span
              className={cx(
                "mb-4 inline-flex min-h-[36px] items-center rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white sm:mb-5",
                "bg-gradient-to-r from-[#E09A2D] to-[#C97A1E] shadow-[0_8px_24px_-6px_rgba(200,120,30,0.45)]"
              )}
            >
              {t.badge}
            </span>

            <h1 className="max-w-[min(100%,18ch)] font-serif text-[clamp(1.7rem,4.2vw+0.65rem,3.35rem)] font-bold leading-[1.08] tracking-tight text-[#1E1810] min-[400px]:max-w-none md:text-[3.1rem] lg:text-[3.35rem]">
              {t.heroEmoji ? (
                <span className="mr-2 inline-block" aria-hidden>
                  {t.heroEmoji}
                </span>
              ) : null}
              {t.hero}
            </h1>
            <p className="mt-3 max-w-[min(100%,36rem)] text-pretty text-[15px] leading-relaxed text-[#3D3428]/95 sm:mt-4 sm:text-lg">
              {t.sub}
            </p>
            <p className="mt-2.5 max-w-[min(100%,28rem)] text-pretty text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-[#4A6678] sm:mt-3 sm:text-[12px] sm:tracking-[0.16em]">
              {t.premiumTagline}
            </p>

            <form
              className="mt-6 w-full min-w-0 max-w-3xl text-left sm:mt-8 lg:mt-9"
              action="/clasificados/en-venta/results"
              method="get"
              role="search"
            >
              <input type="hidden" name="lang" value={lang} />
                <div
                className={cx(
                  "flex flex-col gap-0 overflow-hidden rounded-[22px] border border-white/80 bg-white/[0.94] shadow-[0_14px_48px_-22px_rgba(47,74,101,0.22),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-md",
                  "md:rounded-[24px]",
                  "xl:flex-row xl:items-stretch xl:rounded-full"
                )}
              >
                <label className="flex min-h-[52px] min-w-0 flex-1 cursor-text items-center gap-2.5 px-3 sm:gap-3 sm:px-4 xl:min-w-[120px] xl:flex-1 xl:pl-6 xl:pr-4">
                  <span className="shrink-0 text-[#4A6678]" aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3-3" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    name="q"
                    type="search"
                    autoComplete="off"
                    placeholder={t.searchPh}
                    className="min-h-[48px] min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#1E1810] placeholder:text-[#7A7164] outline-none sm:min-h-[44px]"
                  />
                </label>

                <div className="hidden w-px shrink-0 self-stretch bg-[#E5DDD0] xl:my-3 xl:block" aria-hidden />

                <div className="grid min-w-0 grid-cols-1 border-t border-[#EDE6DA] sm:grid-cols-2 xl:contents xl:border-0">
                  <div className="flex min-h-[52px] min-w-0 items-center gap-2 px-3 sm:px-4 xl:w-[min(100%,240px)] xl:max-w-[240px] xl:shrink-0 xl:px-3">
                    <span className="shrink-0 text-[#4A6678]" aria-hidden>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </span>
                    <select
                      name="city"
                      defaultValue=""
                      aria-label={t.cityPh}
                      className="min-h-[48px] w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] py-2 pl-3 pr-8 text-[14px] font-medium text-[#2C2416] outline-none transition focus:border-[#C9B46A]/60 sm:min-h-[44px]"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234A6678' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                      }}
                    >
                      <option value="">{t.cityPh}</option>
                      {EN_VENTA_HUB_CITY_PRESETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex min-w-0 border-t border-[#EDE6DA] p-2 sm:border-l sm:border-t-0 sm:border-[#EDE6DA] xl:flex xl:items-stretch xl:p-2">
                    <button type="submit" className={cx(goldBtn, "h-[48px] w-full min-w-0 xl:w-auto xl:min-w-[112px] xl:px-7")}>
                      {t.search}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <p className="mt-4 max-w-lg text-pretty text-[12px] font-medium leading-snug text-[#4A6678] sm:mt-5 sm:text-sm">{t.socialProof}</p>

            <div className="mx-auto mt-6 flex w-full min-w-0 max-w-[min(100%,36rem)] flex-col gap-3 sm:mt-8 sm:max-w-2xl sm:flex-row sm:justify-center sm:gap-4">
              <Link href={publishHref} className={cx(goldBtn, "w-full min-w-0 sm:w-[min(100%,280px)]")}>
                <span aria-hidden className="text-lg font-light">
                  +
                </span>
                {t.publish}
              </Link>
              <Link href={allListingsHref} className={cx(ivoryBtn, "w-full min-w-0 sm:w-[min(100%,280px)]")}>
                {t.lista}
              </Link>
            </div>
          </div>
        </section>

        {/* Success layer: seller trust + browse chips + results handoff (all links real) */}
        <section className="mt-8 sm:mt-10" aria-label={lang === "es" ? "Cómo explorar En Venta" : "How to explore For Sale"}>
          <div className="rounded-[22px] border border-white/70 bg-[#FFFCF7]/92 px-4 py-4 shadow-[0_8px_32px_-14px_rgba(47,74,101,0.12)] sm:px-6 sm:py-5">
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
          </div>

          <h3 className="mb-2.5 mt-6 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C5346] sm:mb-3 sm:mt-7 sm:tracking-[0.16em]">
            {t.browseSectionLabel}
          </h3>
          <div className="flex w-full min-w-0 flex-wrap justify-center gap-2 px-0.5 sm:gap-2.5">
            <Link href={hrefBrowseNewest} className={chipNeutral}>
              {t.browseChipNewest}
            </Link>
            <Link href={hrefBrowseNear} className={chipNeutral}>
              {t.browseChipNear}
            </Link>
            <Link href={hrefBrowseShip} className={chipNeutral}>
              {t.browseChipShip}
            </Link>
            <Link href={hrefBrowsePickup} className={chipNeutral}>
              {t.browseChipPickup}
            </Link>
            <Link href={hrefBrowseFeatured} className={chipFeaturedCls}>
              <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 text-[#B8891A]" aria-hidden fill="currentColor">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
              {t.browseChipFeatured}
            </Link>
          </div>

          <p className="mx-auto mt-3 max-w-xl text-center text-[11px] leading-relaxed text-[#5C5346] sm:mt-4 sm:text-[12px]">{t.exposureHint}</p>

          <p className="mx-auto mt-4 max-w-2xl text-center text-[13px] leading-relaxed text-[#4A6678] sm:mt-5 sm:text-sm">
            {t.handoff}
          </p>
        </section>

        {/* Categories */}
        <section className="mt-11 sm:mt-16">
          <h2 className="text-center font-serif text-[1.35rem] font-bold tracking-tight text-[#1E1810] sm:text-3xl">
            {t.categoriesTitle}
          </h2>
          <div className="mt-7 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-10 sm:gap-4 lg:gap-5 xl:grid-cols-4">
            {EN_VENTA_DEPARTMENTS.map((d) => {
              const href = buildEnVentaResultsUrl(lang, { evDept: d.key });
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
        </section>

        {/* Trust */}
        <section className="mt-11 sm:mt-16">
          <div className="rounded-[24px] border border-white/75 bg-[#FFFCF7]/90 px-4 py-7 shadow-[0_14px_44px_-18px_rgba(42,36,22,0.14)] sm:px-8 sm:py-8">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8">
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

        {/* Bottom sell CTA */}
        <section className="mt-10 sm:mt-14">
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
      </main>

      {/* Mobile: persistent publish + browse — high visibility without duplicating full hero labels */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/96 shadow-[0_-10px_40px_-12px_rgba(42,36,22,0.18)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="navigation"
        aria-label={lang === "es" ? "Acciones rápidas" : "Quick actions"}
      >
        <div className="mx-auto flex max-w-6xl gap-2 px-3 py-2.5">
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
