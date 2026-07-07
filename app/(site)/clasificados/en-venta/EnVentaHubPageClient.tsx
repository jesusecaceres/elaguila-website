"use client";

import Link from "next/link";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { useSearchParams } from "next/navigation";
import { buildEnVentaResultsUrl } from "./shared/constants/enVentaResultsRoutes";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";
import type { EnVentaHubLandingResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import type { EnVentaPublicBrowseListing } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  categoryStandardSearchPlaceholder,
  categoryStandardTitle,
  categoryStandardDescription,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import {
  EV_BTN_PRIMARY,
  EV_BTN_SECONDARY,
} from "./shared/styles/enVentaLeonixPublicUi";
import { EnVentaHubRecentListings } from "./hub/EnVentaHubRecentListings";
import { EnVentaHubHorizontalScroll, enVentaSwipeHintLabel } from "./hub/EnVentaHubHorizontalScroll";
import { EnVentaHubMoreFilters } from "./hub/EnVentaHubMoreFilters";
import { EnVentaCompactSearchCanvas } from "./shared/components/EnVentaCompactSearchCanvas";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Lang = "es" | "en";

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
  const hrefSellerIndividual = buildEnVentaResultsUrl(routeLang as Lang, { seller: "individual" });
  const hrefSellerBusiness = buildEnVentaResultsUrl(routeLang as Lang, { seller: "business" });

  const t = hub;

  const primaryCta = `${EV_BTN_PRIMARY} min-h-[2.75rem] px-5 text-[15px]`;
  const mobileStickyPrimary = `${EV_BTN_PRIMARY} min-h-[2.625rem] flex-1 px-3 text-[13px]`;
  const mobileStickySecondary = `${EV_BTN_SECONDARY} min-h-[2.625rem] flex-1 px-3 text-[13px]`;

  const popularCategoryChips: Array<{ key: string; label: string; href: string }> = [
    {
      key: "electronicos",
      label: lang === "es" ? "Electrónica y tech" : "Electronics & tech",
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "electronicos" }),
    },
    {
      key: "hogar",
      label: lang === "es" ? "Hogar y electrodomésticos" : "Home & appliances",
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "hogar" }),
    },
    {
      key: "muebles",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "muebles")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "muebles" }),
    },
    {
      key: "ropa",
      label: lang === "es" ? "Ropa" : "Clothing",
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "ropa-accesorios" }),
    },
    {
      key: "deportes",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "deportes")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "deportes" }),
    },
    {
      key: "bebes",
      label: lang === "es" ? "Bebés y niños" : "Baby & kids",
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "bebes-ninos" }),
    },
    {
      key: "herramientas",
      label: EN_VENTA_DEPARTMENTS.find((d) => d.key === "herramientas")!.label[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "herramientas" }),
    },
    {
      key: "otros",
      label: lang === "es" ? "Otro" : "Other",
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: "otros" }),
    },
  ];

  const swipeHint = enVentaSwipeHintLabel(lang);

  const enVentaSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query=""
      city=""
      state=""
      zip=""
      country=""
      onQuery={() => {}}
      onCity={() => {}}
      onState={() => {}}
      onZip={() => {}}
      onCountry={() => {}}
      onSearch={() => {}}
      onOpenFilters={() => {}}
      browseAllHref={allListingsHref}
      browseAllLabel={t.lista}
      searchButtonLabel={t.search}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={t.publish}
    />
  );

  const buyerShortcutChips: Array<{ key: string; label: string; href: string }> = [
    {
      key: "free",
      label: lang === "es" ? "Gratis" : "Free",
      href: buildEnVentaResultsUrl(routeLang as Lang, { free: "1" }),
    },
    {
      key: "under50",
      label: lang === "es" ? "Menos de $50" : "Under $50",
      href: buildEnVentaResultsUrl(routeLang as Lang, { priceMax: "50" }),
    },
    {
      key: "pickup",
      label: lang === "es" ? "Recogida" : "Pickup",
      href: buildEnVentaResultsUrl(routeLang as Lang, { pickup: "1" }),
    },
    {
      key: "ship",
      label: lang === "es" ? "Envío" : "Shipping",
      href: buildEnVentaResultsUrl(routeLang as Lang, { ship: "1" }),
    },
    {
      key: "newest",
      label: lang === "es" ? "Más recientes" : "Newest",
      href: buildEnVentaResultsUrl(routeLang as Lang, { sort: "newest" }),
    },
  ];

  return (
    <>
      <LeonixCategoryPageShell surface="landing">
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={categoryStandardTitle("en-venta", lang)}
        tagline=""
        intro={categoryStandardDescription("en-venta", lang)}
        introSecondary=""
        searchSlot={enVentaSearchForm}
        eyebrow={t.badge}
      />

      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Explorar por categoría" : "Browse by category"}
          subtitle=""
          variant="default"
          chips={popularCategoryChips.map((chip) => ({ id: chip.key, label: chip.label, href: chip.href }))}
        />

        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Atajos para compradores" : "Buyer shortcuts"}
          subtitle=""
          variant="default"
          chips={buyerShortcutChips.map((chip) => ({ id: chip.key, label: chip.label, href: chip.href }))}
        />

        <EnVentaHubRecentListings
          listings={initialLiveListings}
          lang={lang}
          allListingsHref={allListingsHref}
          allListingsLabel={t.lista}
        />

        <div className="mt-6 sm:mt-8">
          <CategoryVisibilityCta lang={lang} category="en-venta" surface="landing" compact />
        </div>

        {/* Trust — horizontal strip on mobile */}
        <section className="mt-4 sm:mt-8" aria-label={lang === "es" ? "Confianza y seguridad" : "Trust and safety"}>
          <div className="rounded-[20px] border border-white/75 bg-[#FFFCF7]/90 px-3 py-2.5 shadow-[0_10px_36px_-16px_rgba(42,36,22,0.14)] sm:rounded-[22px] sm:px-6 sm:py-6">
            <EnVentaHubHorizontalScroll
              label={lang === "es" ? "Compra con confianza" : "Shop with confidence"}
              swipeHint={swipeHint}
              lang={lang}
              className="sm:hidden"
              edgeFadeFromClass="from-[#FFFCF7]"
            >
              {[
                { icon: TrustIconGift, title: t.trust1Title, sub: t.trust1Sub, warm: true },
                { icon: TrustIconShield, title: t.trust2Title, sub: t.trust2Sub, warm: false },
                { icon: TrustIconPeople, title: t.trust3Title, sub: t.trust3Sub, warm: true },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex w-[min(68vw,232px)] shrink-0 snap-start flex-col rounded-2xl border border-[#E8DFD0]/80 bg-white/60 p-3.5 text-left"
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
        <section className="mt-4 sm:mt-8">
          <div className="rounded-[18px] border border-white/70 bg-[#FFFCF7]/92 px-4 py-3 shadow-[0_6px_24px_-14px_rgba(47,74,101,0.12)] sm:rounded-[20px] sm:px-5 sm:py-5">
            <p className="text-center text-[14px] leading-snug text-[#2C2416] sm:text-[15px] sm:leading-relaxed">{t.sellerTrust}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={hrefSellerIndividual}
                className={`${EV_BTN_SECONDARY} min-h-[2.75rem] px-4 text-[13px]`}
              >
                {t.sellerLinkInd}
              </Link>
              <Link
                href={hrefSellerBusiness}
                className={`${EV_BTN_SECONDARY} min-h-[2.75rem] px-4 text-[13px]`}
              >
                {t.sellerLinkBiz}
              </Link>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[13px] leading-relaxed text-[#4A6678] sm:text-sm">{t.handoff}</p>
          </div>
        </section>

        {/* Bottom sell CTA */}
        <section className="mt-4 sm:mt-8">
          <div className="flex flex-col items-start justify-between gap-3 rounded-[20px] border border-white/75 bg-[#FFFCF7]/95 px-4 py-4 shadow-[0_16px_48px_-20px_rgba(47,74,101,0.18)] sm:flex-row sm:items-center sm:gap-8 sm:rounded-[24px] sm:px-10 sm:py-10">
            <div className="min-w-0 max-w-xl flex-1">
              <h2 className="font-serif text-[1.15rem] font-bold text-[#1E1810] sm:text-2xl">{t.bottomSellTitle}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#3d556b] sm:text-base">{t.bottomSellSub}</p>
            </div>
            <Link
              href={publishHref}
              className={cx(primaryCta, "w-full shrink-0 sm:w-auto")}
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

      {/* Mobile: compact publish + browse dock */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DFD0]/75 bg-[#FFFCF7]/94 shadow-[0_-3px_16px_-8px_rgba(42,36,22,0.12)] backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "max(0.125rem, env(safe-area-inset-bottom, 0px))" }}
        role="navigation"
        aria-label={lang === "es" ? "Acciones rápidas" : "Quick actions"}
      >
        <div className="mx-auto flex max-w-[1080px] gap-1.5 px-2.5 py-1">
          <Link href={publishHref} className={mobileStickyPrimary}>
            {t.mobileStickyPublish}
          </Link>
          <Link href={allListingsHref} className={mobileStickySecondary}>
            {t.mobileStickyBrowse}
          </Link>
        </div>
      </div>
    </LeonixCategoryPageShell>
    </>
  );
}
