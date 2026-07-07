"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { replaceLangInHref } from "@/app/lib/language";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl } from "../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../filters/autosPublicFilterTypes";
import {
  getLandingDealerSpotlightListings,
  getLandingPrivateFreshListings,
} from "../data/autosLandingArrangement";
import { useAutosPublicListingsFetch } from "../components/public/useAutosPublicListingsFetch";
import type { AutosLandingDealerSample } from "./autosLandingDealerSamples";
import { buildAutosLandingDealersFromInventory } from "./buildAutosLandingDealersFromInventory";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { AutosLandingShell } from "./AutosLandingShell";
import { AutosHeroSearch } from "./AutosHeroSearch";
import { AutosLandingLangSwitch } from "./AutosLandingLangSwitch";
import { AutosQuickChips } from "./AutosQuickChips";
import { AutosPrimaryDiscoveryCta } from "./AutosPrimaryDiscoveryCta";
import { FeaturedCarsSection } from "./FeaturedCarsSection";
import { FeaturedDealersSection } from "./FeaturedDealersSection";
import { RecentAutosSection } from "./RecentAutosSection";
import { AutosLandingPublishCTA } from "./AutosLandingPublishCTA";
import { autosLandingSectionClass } from "./autosLandingLayout";
import { AutosPublicInventoryNotice } from "../components/public/AutosPublicInventoryNotice";
import { AutosMarketPeerCrossLink } from "../components/public/AutosMarketPeerCrossLink";
import type { AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";
import {
  autosMarketDefaultSellerType,
  autosMarketPeerResultsPath,
  autosMarketPublishPath,
  autosMarketResultsPath,
} from "@/app/lib/clasificados/autos/autosPublicMarket";
import { getAutosPublicMarketCopy } from "@/app/lib/clasificados/autos/autosPublicMarketCopy";

export function AutosLandingPage({ market = "private" }: { market?: AutosPublicMarket }) {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const browseState = useMemo(() => parseAutosBrowseUrl(new URLSearchParams(spStr)), [spStr]);
  const lang: AutosPublicLang = browseState.lang;
  const routeLang = browseState.routeLang;
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];
  const marketCopy = getAutosPublicMarketCopy(market, lang);
  const isPrivateMarket = market === "private";
  const isDealerMarket = market === "dealer";
  const RESULTADOS_PATH = autosMarketResultsPath(market);
  const defaultSeller = autosMarketDefaultSellerType(market);

  const [searchQ, setSearchQ] = useState("");
  const [city, setCity] = useState("San Jose");
  const [zip, setZip] = useState("");

  useEffect(() => {
    const b = parseAutosBrowseUrl(new URLSearchParams(spStr));
    setSearchQ(b.q);
    setCity(b.filters.city.trim() || "San Jose");
    setZip(b.filters.zip);
  }, [spStr]);

  const { listings: inventory, loaded, isDemoInventory } = useAutosPublicListingsFetch();
  const dealerSpotlight = useMemo(() => getLandingDealerSpotlightListings(inventory, 6), [inventory]);
  const privateFresh = useMemo(() => getLandingPrivateFreshListings(inventory, 6), [inventory]);

  const landingDealers = useMemo(() => buildAutosLandingDealersFromInventory(inventory, 4), [inventory]);

  const resultsHref = useCallback(
    (bundle: Parameters<typeof serializeAutosBrowseUrl>[0]) => `${RESULTADOS_PATH}?${serializeAutosBrowseUrl(bundle)}`,
    [],
  );

  const chipHref = useCallback(
    (patch: Partial<ReturnType<typeof emptyAutosPublicFilters>>) =>
      resultsHref({
        filters: { ...emptyAutosPublicFilters(), ...patch },
        q: "",
        sort: "newest",
        page: 1,
        lang,
        routeLang,
      }),
    [lang, routeLang, resultsHref],
  );

  const searchHref = useMemo(() => {
    const filters = { ...emptyAutosPublicFilters(), sellerType: defaultSeller };
    const rawCity = city.trim();
    filters.city = getCanonicalCityName(rawCity) || rawCity;
    filters.zip = zip.replace(/\D/g, "").slice(0, 5);
    return resultsHref({
      filters,
      q: searchQ.trim(),
      sort: "newest",
      page: 1,
      lang,
      routeLang,
    });
  }, [defaultSeller, lang, routeLang, searchQ, city, zip, resultsHref]);

  const browseAllHref = useMemo(
    () =>
      resultsHref({
        filters: { ...emptyAutosPublicFilters(), sellerType: defaultSeller },
        q: "",
        sort: "newest",
        page: 1,
        lang,
        routeLang,
      }),
    [defaultSeller, lang, routeLang, resultsHref],
  );

  const publishAutosHref = replaceLangInHref(autosMarketPublishPath(market), routeLang);
  const peerResultsHref = useMemo(() => {
    const peerPath = autosMarketPeerResultsPath(market);
    return `${peerPath}?${serializeAutosBrowseUrl({
      filters: { ...emptyAutosPublicFilters(), sellerType: autosMarketDefaultSellerType(market === "private" ? "dealer" : "private") },
      q: "",
      sort: "newest",
      page: 1,
      lang,
      routeLang,
    })}`;
  }, [lang, routeLang, market]);

  const quickChipItems = useMemo(() => {
    const c = copy;
    if (isPrivateMarket) {
      return [
        { label: c.chips.sedan, href: chipHref({ bodyStyle: "Sedan", sellerType: "private" }) },
        { label: c.chips.suv, href: chipHref({ bodyStyle: "SUV", sellerType: "private" }) },
        { label: c.chips.truck, href: chipHref({ bodyStyle: "Truck", sellerType: "private" }) },
        { label: lang === "es" ? "Menos de $10k" : "Under $10k", href: chipHref({ priceMax: "10000", sellerType: "private" }) },
        { label: c.chipQuickLowMiles, href: chipHref({ mileageMax: "35000", sellerType: "private" }) },
        { label: c.chipQuickPrivate, href: chipHref({ sellerType: "private" }) },
      ];
    }
    return [
      { label: c.chipQuickDealer, href: chipHref({ sellerType: "dealer" }) },
      { label: c.conditionUsed, href: chipHref({ condition: "used", sellerType: "dealer" }) },
      { label: c.conditionNew, href: chipHref({ condition: "new", sellerType: "dealer" }) },
      { label: c.chipQuickLowMiles, href: chipHref({ mileageMax: "35000", sellerType: "dealer" }) },
      { label: c.chips.truck, href: chipHref({ bodyStyle: "Truck", sellerType: "dealer" }) },
      { label: c.chips.suv, href: chipHref({ bodyStyle: "SUV", sellerType: "dealer" }) },
    ];
  }, [copy, chipHref, isPrivateMarket, lang]);

  const buildDealerInventoryHref = useCallback(
    (dealer: AutosLandingDealerSample) => {
      const filters = emptyAutosPublicFilters();
      filters.sellerType = dealer.resultsHandoff.seller;
      const raw = dealer.resultsHandoff.city.trim();
      filters.city = getCanonicalCityName(raw) || raw;
      return resultsHref({
        filters,
        q: dealer.resultsHandoff.q ?? "",
        sort: "newest",
        page: 1,
        lang,
        routeLang,
      });
    },
    [lang, routeLang, resultsHref],
  );

  const clasificadosHome = replaceLangInHref("/clasificados", routeLang);

  const autosSearchForm = (
    <AutosHeroSearch
      mode="fields"
      copy={copy}
      searchQ={searchQ}
      setSearchQ={setSearchQ}
      city={city}
      setCity={setCity}
      zip={zip}
      setZip={setZip}
      searchHref={searchHref}
      browseAllHref={browseAllHref}
    />
  );

  return (
    <AutosLandingShell>
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)]/90 backdrop-blur-md">
        <div className={`${autosLandingSectionClass} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={clasificadosHome} className="hover:text-[color:var(--lx-text)]">
              {copy.breadcrumb}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{marketCopy.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <AutosLandingLangSwitch lang={lang} />
            <Link
              href={publishAutosHref}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90"
            >
              {marketCopy.postAd}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex w-full min-w-0 flex-col gap-5 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] pt-3 sm:gap-7 sm:pt-4 md:gap-8">
        <LeonixCategoryPageShell surface="landing" topSlot={
          <div className="mx-auto flex max-w-[1280px] justify-end px-3.5 pt-3 sm:px-4 lg:px-5">
            <AutosLandingLangSwitch lang={lang} />
          </div>
        }>
          <LeonixCategoryHeroGateway
            lang={lang as V2Lang}
            surface="landing"
            title={marketCopy.heroHeading}
            tagline=""
            intro={marketCopy.heroSubhead}
            introSecondary=""
            searchSlot={autosSearchForm}
            eyebrow={marketCopy.title}
          />
          <LeonixCategoryShortcutSection
            lang={lang as V2Lang}
            surface="landing"
            title={lang === "es" ? "Filtros rápidos" : "Quick filters"}
            subtitle=""
            variant="default"
            chips={quickChipItems.map((item) => ({ id: item.label, label: item.label, href: item.href }))}
          />
        </LeonixCategoryPageShell>

        <AutosMarketPeerCrossLink copy={marketCopy} href={peerResultsHref} />

        <AutosPrimaryDiscoveryCta copy={copy} browseAllHref={browseAllHref} browseLabel={marketCopy.browseAll} />

        <div className={autosLandingSectionClass}>
          <AutosPublicInventoryNotice
            copy={copy}
            loaded={loaded}
            isDemoInventory={isDemoInventory}
            hasAnyListings={inventory.length > 0}
          />
        </div>

        {isDealerMarket ? (
          <FeaturedCarsSection
            copy={copy}
            lang={lang}
            listings={dealerSpotlight}
            heading={copy.landingDealerSpotlightTitle}
            subheading={copy.landingDealerSpotlightSubtitle}
            browseAllHref={browseAllHref}
          />
        ) : null}

        {isPrivateMarket ? (
          <RecentAutosSection
            copy={copy}
            lang={lang}
            listings={privateFresh}
            heading={copy.landingPrivateFreshTitle}
            subheading={copy.landingPrivateFreshSubtitle}
            browseAllHref={browseAllHref}
          />
        ) : null}

        {isDealerMarket && landingDealers.length > 0 ? (
          <FeaturedDealersSection copy={copy} dealers={landingDealers} buildInventoryHref={buildDealerInventoryHref} />
        ) : null}

        <AutosLandingPublishCTA
          copy={copy}
          publishAutosHref={publishAutosHref}
          browseAllHref={browseAllHref}
          publishLabel={marketCopy.postAd}
          browseLabel={marketCopy.browseAll}
        />
      </main>
    </AutosLandingShell>
  );
}
