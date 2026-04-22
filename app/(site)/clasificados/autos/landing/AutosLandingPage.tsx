"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { AUTOS_PUBLIC_BLUEPRINT_COPY } from "../lib/autosPublicBlueprintCopy";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl } from "../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters } from "../filters/autosPublicFilterTypes";
import {
  getLandingDealerSpotlightListings,
  getLandingMixedLatestListings,
  getLandingPrivateFreshListings,
} from "../data/autosLandingArrangement";
import { useAutosPublicListingsFetch } from "../components/public/useAutosPublicListingsFetch";
import type { AutosLandingDealerSample } from "./autosLandingDealerSamples";
import { AUTOS_LANDING_DEALER_SAMPLES } from "./autosLandingDealerSamples";
import { AutosLandingShell } from "./AutosLandingShell";
import { AutosHeroSearch } from "./AutosHeroSearch";
import { AutosLandingLangSwitch } from "./AutosLandingLangSwitch";
import { AutosQuickChips } from "./AutosQuickChips";
import { AutosPrimaryDiscoveryCta } from "./AutosPrimaryDiscoveryCta";
import { FeaturedCarsSection } from "./FeaturedCarsSection";
import { BodyStyleBrowseSection } from "./BodyStyleBrowseSection";
import { NeedBasedBrowseSection } from "./NeedBasedBrowseSection";
import { FeaturedDealersSection } from "./FeaturedDealersSection";
import { RecentAutosSection } from "./RecentAutosSection";
import { AutosLandingPublishCTA } from "./AutosLandingPublishCTA";
import { autosLandingSectionClass } from "./autosLandingLayout";
import { AutosPublicInventoryNotice } from "../components/public/AutosPublicInventoryNotice";

const RESULTADOS_PATH = "/clasificados/autos/resultados";

export function AutosLandingPage() {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const lang: AutosPublicLang = useMemo(() => parseAutosBrowseUrl(new URLSearchParams(spStr)).lang, [spStr]);
  const copy = AUTOS_PUBLIC_BLUEPRINT_COPY[lang];

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
  const mixedLatest = useMemo(() => {
    const exclude = new Set<string>();
    for (const l of dealerSpotlight) exclude.add(l.id);
    for (const l of privateFresh) exclude.add(l.id);
    return getLandingMixedLatestListings(inventory, exclude, 8);
  }, [inventory, dealerSpotlight, privateFresh]);

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
      }),
    [lang, resultsHref],
  );

  const searchHref = useMemo(() => {
    const filters = emptyAutosPublicFilters();
    const rawCity = city.trim();
    filters.city = getCanonicalCityName(rawCity) || rawCity;
    filters.zip = zip.replace(/\D/g, "").slice(0, 5);
    return resultsHref({
      filters,
      q: searchQ.trim(),
      sort: "newest",
      page: 1,
      lang,
    });
  }, [lang, searchQ, city, zip, resultsHref]);

  const browseAllHref = useMemo(
    () =>
      resultsHref({
        filters: emptyAutosPublicFilters(),
        q: "",
        sort: "newest",
        page: 1,
        lang,
      }),
    [lang, resultsHref],
  );

  const publishAutosHref = appendLangToPath("/publicar/autos", lang as Lang);

  const quickChipItems = useMemo(() => {
    const c = copy;
    return [
      { label: c.chips.sedan, href: chipHref({ bodyStyle: "Sedan" }) },
      { label: c.chips.suv, href: chipHref({ bodyStyle: "SUV" }) },
      { label: c.chips.truck, href: chipHref({ bodyStyle: "Truck" }) },
      { label: c.chips.coupe, href: chipHref({ bodyStyle: "Coupe" }) },
      { label: c.chips.hatchback, href: chipHref({ bodyStyle: "Hatchback" }) },
      { label: c.chips.luxury, href: chipHref({ priceMin: "45000" }) },
      { label: c.chips.economical, href: chipHref({ priceMax: "22000" }) },
      { label: c.chips.family, href: chipHref({ bodyStyle: "Minivan" }) },
    ];
  }, [copy, chipHref]);

  const bodyStyleTiles = useMemo(() => {
    const b = copy.bodyStyleBrowse;
    return [
      { label: b.sedans, imageKey: "sedan" as const, href: chipHref({ bodyStyle: "Sedan" }) },
      { label: b.suvs, imageKey: "suv" as const, href: chipHref({ bodyStyle: "SUV" }) },
      { label: b.trucks, imageKey: "truck" as const, href: chipHref({ bodyStyle: "Truck" }) },
      { label: b.coupes, imageKey: "coupe" as const, href: chipHref({ bodyStyle: "Coupe" }) },
      { label: b.minivans, imageKey: "minivan" as const, href: chipHref({ bodyStyle: "Minivan" }) },
      { label: b.hatchbacks, imageKey: "hatchback" as const, href: chipHref({ bodyStyle: "Hatchback" }) },
    ];
  }, [copy, chipHref]);

  const needCards = useMemo(() => {
    const n = copy.needBrowse;
    const h = copy.needBrowseHint;
    return [
      { key: "firstCar", title: n.firstCar, hint: h.firstCar, href: chipHref({ priceMax: "22000", yearMax: "2019" }) },
      { key: "lowMiles", title: n.lowMiles, hint: h.lowMiles, href: chipHref({ mileageMax: "35000" }) },
      { key: "economical", title: n.economical, hint: h.economical, href: chipHref({ priceMax: "23000" }) },
      { key: "family", title: n.family, hint: h.family, href: chipHref({ bodyStyle: "SUV", mileageMax: "60000" }) },
      { key: "work", title: n.work, hint: h.work, href: chipHref({ bodyStyle: "Truck" }) },
      { key: "luxury", title: n.luxury, hint: h.luxury, href: chipHref({ priceMin: "45000" }) },
    ];
  }, [copy, chipHref]);

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
      });
    },
    [lang, resultsHref],
  );

  const clasificadosHome = appendLangToPath("/clasificados", lang as Lang);

  return (
    <AutosLandingShell>
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)]/90 backdrop-blur-md">
        <div className={`${autosLandingSectionClass} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]">
            <Link href={clasificadosHome} className="hover:text-[color:var(--lx-text)]">
              {copy.breadcrumb}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
            <span className="text-[color:var(--lx-text)]">{copy.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <AutosLandingLangSwitch lang={lang} />
            <Link
              href={publishAutosHref}
              className="inline-flex min-h-[44px] items-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90"
            >
              {copy.postAd}
            </Link>
          </div>
        </div>
      </div>

      <main className="flex w-full min-w-0 flex-col gap-7 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] pt-6 sm:gap-9 sm:pt-8 md:gap-10 md:pt-9 lg:gap-11 lg:pt-10 2xl:gap-12">
        <AutosHeroSearch
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

        <AutosQuickChips copy={copy} items={quickChipItems} />

        <AutosPrimaryDiscoveryCta copy={copy} browseAllHref={browseAllHref} />

        <div className={autosLandingSectionClass}>
          <AutosPublicInventoryNotice
            copy={copy}
            loaded={loaded}
            isDemoInventory={isDemoInventory}
            hasAnyListings={inventory.length > 0}
          />
        </div>

        <FeaturedCarsSection
          copy={copy}
          lang={lang}
          listings={dealerSpotlight}
          heading={copy.landingDealerSpotlightTitle}
          subheading={copy.landingDealerSpotlightSubtitle}
        />

        <BodyStyleBrowseSection copy={copy} tiles={bodyStyleTiles} />

        <NeedBasedBrowseSection copy={copy} cards={needCards} />

        <FeaturedDealersSection copy={copy} dealers={AUTOS_LANDING_DEALER_SAMPLES} buildInventoryHref={buildDealerInventoryHref} />

        <RecentAutosSection
          copy={copy}
          lang={lang}
          listings={privateFresh}
          heading={copy.landingPrivateFreshTitle}
          subheading={copy.landingPrivateFreshSubtitle}
        />

        <RecentAutosSection
          copy={copy}
          lang={lang}
          listings={mixedLatest}
          heading={copy.landingMixedLatestTitle}
          subheading={copy.landingMixedLatestSubtitle}
        />

        <AutosLandingPublishCTA copy={copy} publishAutosHref={publishAutosHref} browseAllHref={browseAllHref} />
      </main>
    </AutosLandingShell>
  );
}
