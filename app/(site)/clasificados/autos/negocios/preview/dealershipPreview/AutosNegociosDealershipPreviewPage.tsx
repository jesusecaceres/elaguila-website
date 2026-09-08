"use client";

import { useMemo } from "react";
import type { AutoDealerListing, VehicleBadge } from "../../types/autoDealerListing";
import type { AutosNegociosCopy } from "../../lib/autosNegociosCopy";
import {
  hasDescriptionSection,
  hasHeroMedia,
  hasHighlightsSection,
  hasSpecsSection,
  hasTitleBand,
} from "../../lib/autoDealerPresence";
import {
  formatCityStateLabel,
  formatCityStateZipLine,
  formatMiles,
  formatStockDisplay,
  formatUsd,
  polishMonthlyEstimateDisplay,
} from "../../components/autoDealerFormatters";
import { PreviewAutoGallery } from "./PreviewAutoGallery";
import { PreviewDealerBusinessStack } from "./PreviewDealerBusinessStack";
import { PreviewRelatedDealerCars } from "./PreviewRelatedDealerCars";
import { AutosNegociosPreviewEngagementStrip } from "../../components/AutosNegociosPreviewEngagementStrip";
import { PreviewVehicleDescription } from "./PreviewVehicleDescription";
import { PreviewVehicleHighlights } from "./PreviewVehicleHighlights";
import { PreviewVehicleSpecsGrid } from "./PreviewVehicleSpecsGrid";
import { PreviewVehicleHeroSpecsStrip } from "./PreviewVehicleHeroSpecsStrip";
import { AutoDealerPreviewChrome } from "../../components/AutoDealerPreviewChrome";
import { useAutosNegociosPreviewCopy } from "../../lib/AutosNegociosPreviewLocaleContext";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import type { AutosPublicListingAnalyticsProps } from "../../../lib/autosAnalyticsIdentity";
import { FiHash, FiMapPin } from "react-icons/fi";
import { BiTachometer } from "react-icons/bi";
import { buildDealershipPreviewHeroKeySpecs, withMpgHeroItem } from "./buildDealershipPreviewHeroKeySpecs";
import { PreviewBuyerTrustStrip } from "./PreviewBuyerTrustStrip";
import { resolveBodyStyle } from "../../lib/autoDealerSelectResolve";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewBusinessHubShellClass,
  autosPreviewHeroPriceClass,
  autosPreviewHeroTitleClass,
  autosPreviewMainGridClass,
  autosPreviewPageCanvasClass,
  autosPreviewPageMaxWidthClass,
  autosPreviewPremiumCardClass,
  autosPreviewRectBadgeClass,
  autosPreviewSectionEyebrowClass,
} from "./previewPremiumTokens";

const MAIN_CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function badgeLabelFor(t: AutosNegociosCopy, key: VehicleBadge): string {
  return t.taxonomy.badges.find((b) => b.key === key)?.label ?? key;
}

function monthlyEstimateLine(raw: string | undefined | null, lang: "es" | "en"): string {
  const polished = polishMonthlyEstimateDisplay(raw ?? undefined);
  if (!polished) return "";
  if (/^o\s/i.test(polished)) return polished;
  return lang === "es" ? `o ${polished}` : `or ${polished}`;
}

function conditionBadgeLabel(t: AutosNegociosCopy, condition: AutoDealerListing["condition"]): string | null {
  if (!condition) return null;
  const row = t.taxonomy.condition.find((x) => x.value === condition);
  return row?.label?.trim() || null;
}

export function AutosNegociosDealershipPreviewPage({
  data,
  editBackHref,
  publicPlaybackOnly = false,
  publicAnalytics,
  publicUrl,
  relatedPreviewOnly = false,
  embeddedInShell = false,
  draftPreviewMode = false,
  heroSpecItems: heroSpecItemsProp,
}: {
  data: AutoDealerListing;
  /** Subtle return link to the listing editor (e.g. Publicar flow). */
  editBackHref?: string;
  /** Live published detail: gallery video uses durable URLs only. */
  publicPlaybackOnly?: boolean;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  publicUrl?: string;
  /** Draft child preview: related cards are non-navigable placeholders. */
  relatedPreviewOnly?: boolean;
  /** Parent already rendered preview chrome — skip duplicate header/logo. */
  embeddedInShell?: boolean;
  /** Pre-publish capture preview — stronger buyer-facing hierarchy. */
  draftPreviewMode?: boolean;
  heroSpecItems?: Array<{ key: string; label: string; value: string }>;
}) {
  const { t, lang } = useAutosNegociosPreviewCopy();
  const pt = t.preview.title;

  const loc = formatCityStateZipLine(data.city, data.state, data.zip) || formatCityStateLabel(data.city, data.state);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const showTitle = hasTitleBand(data);
  const showGallery = hasHeroMedia(data);
  const showSpecs = hasSpecsSection(data);
  const showHighlights = hasHighlightsSection(data);
  const showDesc = hasDescriptionSection(data);

  const analyticsMetrics = data.listingAnalytics;
  const showAnalyticsStrip =
    publicPlaybackOnly &&
    analyticsMetrics != null &&
    (analyticsMetrics.views > 0 ||
      analyticsMetrics.saves > 0 ||
      analyticsMetrics.shares > 0 ||
      analyticsMetrics.contacts > 0);
  const pa = t.preview.analytics;

  const heroSpecItems = useMemo(() => {
    const base =
      heroSpecItemsProp && heroSpecItemsProp.length > 0
        ? heroSpecItemsProp
        : buildDealershipPreviewHeroKeySpecs(data, lang);
    return withMpgHeroItem(base, data, lang);
  }, [data, heroSpecItemsProp, lang]);
  const showHeroSpecs = heroSpecItems.length > 0;
  /** Full specs section shouldn't repeat fields already shown strongly in the hero key-spec strip. */
  const heroSpecRowKeys = useMemo(() => heroSpecItems.map((item) => item.key), [heroSpecItems]);

  const showUnifiedCanvas = showTitle || showGallery || showHeroSpecs;

  let r = 1;
  const unifiedCanvasRow = showUnifiedCanvas ? r++ : undefined;
  const analyticsRow = showAnalyticsStrip ? r++ : undefined;
  const specsRow = showSpecs ? r++ : undefined;
  const highlightsRow = showHighlights ? r++ : undefined;
  const descRow = showDesc ? r++ : undefined;
  const relatedRow = (data.relatedDealerListings ?? []).length > 0 ? r++ : undefined;
  const trustRow = r++;
  const leftRowCount = r - 1;

  const badges = data.badges ?? [];
  const bodyBadge = resolveBodyStyle(data);
  const conditionLabel = conditionBadgeLabel(t, data.condition);
  const chipLabels = [
    ...(bodyBadge ? [bodyBadge] : []),
    ...(conditionLabel ? [conditionLabel] : []),
    ...badges.map((b) => badgeLabelFor(t, b)),
  ].filter((label, idx, arr) => arr.findIndex((x) => x.toLowerCase() === label.toLowerCase()) === idx);

  const h1 = data.vehicleTitle?.trim();
  const showMileage = data.mileage !== undefined && Number.isFinite(data.mileage);
  const showLoc = nonEmpty(loc);
  const showStock = nonEmpty(data.stockNumber);
  const monthlyLine = monthlyEstimateLine(data.monthlyEstimate, lang);
  const showPriceCol = priceOk || nonEmpty(monthlyLine);
  const showHeaderMeta = showMileage || showStock || showLoc;

  let ord = 1;
  const orderUnifiedCanvas = showUnifiedCanvas ? ord++ : undefined;
  const orderAnalytics = showAnalyticsStrip ? ord++ : undefined;
  const orderAside = ord++;
  const orderSpecs = showSpecs ? ord++ : undefined;
  const orderHi = showHighlights ? ord++ : undefined;
  const orderDesc = showDesc ? ord++ : undefined;
  const orderRelated = (data.relatedDealerListings ?? []).length > 0 ? ord++ : undefined;
  const orderTrust = ord++;

  const mainContent = (
    <main
      className={`mx-auto ${autosPreviewPageMaxWidthClass} ${autosPreviewPageCanvasClass} px-[max(1rem,env(safe-area-inset-left))] pb-8 pr-[max(1rem,env(safe-area-inset-right))] md:px-6 lg:px-8 ${
        embeddedInShell ? "pt-2 sm:pt-3" : "pt-1 sm:mt-8 sm:pb-10"
      }`}
      data-autos-premium-preview-page="1"
    >
      <div className={autosPreviewMainGridClass}>
        {showUnifiedCanvas ? (
          <section
            id={AUTOS_PREVIEW_SECTION_IDS.hero}
            data-autos-unified-vehicle-canvas="1"
            className={`${MAIN_CARD} scroll-mt-28 lg:col-start-1 ${
              draftPreviewMode ? "shadow-[0_16px_48px_-16px_rgba(42,36,22,0.16)]" : ""
            }`}
            style={{ gridRowStart: unifiedCanvasRow, order: orderUnifiedCanvas }}
          >
            {draftPreviewMode ? (
              <p className={autosPreviewSectionEyebrowClass}>
                {lang === "es" ? "Vista previa del anuncio" : "Listing preview"}
              </p>
            ) : null}

            {showTitle && (h1 || showPriceCol || showHeaderMeta || chipLabels.length > 0) ? (
              <div className={`${draftPreviewMode ? "mt-2" : ""}`} data-autos-unified-canvas-header="1">
                {h1 ? <h1 className={`${autosPreviewHeroTitleClass} text-balance`}>{h1}</h1> : null}

                {chipLabels.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {chipLabels.map((label) => (
                      <li key={label} className={autosPreviewRectBadgeClass}>
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {showPriceCol ? (
                  <div className="mt-4">
                    {priceOk ? <p className={autosPreviewHeroPriceClass}>{formatUsd(data.price)}</p> : null}
                    {nonEmpty(monthlyLine) ? (
                      <p
                        className={`flex items-center gap-1.5 text-sm font-semibold text-[#5C5346] ${priceOk ? "mt-1.5" : ""}`}
                        title={
                          lang === "es"
                            ? "Estimado del anunciante. No es una aprobación de crédito."
                            : "Advertiser estimate. Not a credit approval."
                        }
                      >
                        <span>{monthlyLine}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">*</span>
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {showHeaderMeta ? (
                  <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#5C5346]">
                    {showLoc ? (
                      <li className="inline-flex min-w-0 items-center gap-1.5">
                        <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        <span className="min-w-0 break-words">{loc}</span>
                      </li>
                    ) : null}
                    {showMileage ? (
                      <li className="inline-flex items-center gap-1.5">
                        <BiTachometer className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        <span>
                          {formatMiles(data.mileage)} {lang === "es" ? "millas" : "miles"}
                        </span>
                      </li>
                    ) : null}
                    {showStock ? (
                      <li className="inline-flex items-center gap-1.5">
                        <FiHash className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                        <span>
                          {pt.stock} {formatStockDisplay(data.stockNumber)}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {showGallery ? (
              <div
                className={`min-w-0 ${showTitle ? "mt-5 border-t border-[#D6C7AD]/55 pt-5" : ""}`}
                data-autos-unified-canvas-gallery="1"
              >
                <PreviewAutoGallery data={data} publicPlaybackOnly={publicPlaybackOnly} embeddedInCanvas mockupShelf />
              </div>
            ) : null}

            {showHeroSpecs ? <PreviewVehicleHeroSpecsStrip items={heroSpecItems} /> : null}

            {showGallery ? (
              <div
                className="mt-4 border-t border-[#D6C7AD]/55 pt-4"
                data-autos-unified-canvas-utility="1"
              >
                <AutosNegociosPreviewEngagementStrip
                  lang={lang}
                  alignStart
                  listingSourceId={publicPlaybackOnly ? publicAnalytics?.listingSourceId : undefined}
                  leonixAdId={publicAnalytics?.leonixAdId}
                  listingTitle={h1}
                  listingUrl={publicUrl}
                  likeCount={analyticsMetrics?.likes ?? 0}
                  publicAnalytics={publicPlaybackOnly ? publicAnalytics : undefined}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {showAnalyticsStrip && analyticsMetrics ? (
          <div className="lg:col-start-1" style={{ gridRowStart: analyticsRow, order: orderAnalytics }}>
            <AutosListingAnalyticsRow
              metrics={analyticsMetrics}
              labels={{
                kicker: pa.kicker,
                views: pa.views,
                saves: pa.saves,
                shares: pa.shares,
                contacts: pa.contacts,
                footnote: publicPlaybackOnly ? undefined : pa.footnote,
              }}
            />
          </div>
        ) : null}

        <aside
          id={AUTOS_PREVIEW_SECTION_IDS.businessHub}
          className="autos-negocios-preview-dealer-aside flex min-w-0 scroll-mt-28 flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-full lg:self-start"
          style={{
            gridRowStart: leftRowCount > 0 ? 1 : undefined,
            gridRowEnd: leftRowCount > 0 ? `span ${leftRowCount}` : undefined,
            order: orderAside,
          }}
        >
          <div className={`${autosPreviewBusinessHubShellClass} lg:sticky lg:top-28`}>
            <PreviewDealerBusinessStack
              data={data}
              buyerInventoryHref={publicPlaybackOnly ? data.relatedDealerInventoryHref : undefined}
              publicAnalytics={publicAnalytics}
              publicUrl={publicUrl}
              publicPlaybackOnly={publicPlaybackOnly}
              draftPreviewMode={draftPreviewMode}
              showPremiumHubHeader={draftPreviewMode || publicPlaybackOnly}
              className="rounded-none border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </aside>

        {showSpecs ? (
          <div
            id={AUTOS_PREVIEW_SECTION_IDS.specs}
            className="scroll-mt-28 lg:col-start-1"
            style={{ gridRowStart: specsRow, order: orderSpecs }}
          >
            <PreviewVehicleSpecsGrid data={data} hiddenRowKeys={heroSpecRowKeys} />
          </div>
        ) : null}

        {showHighlights ? (
          <div
            id={AUTOS_PREVIEW_SECTION_IDS.highlights}
            className="scroll-mt-28 lg:col-start-1"
            style={{ gridRowStart: highlightsRow, order: orderHi }}
          >
            <PreviewVehicleHighlights data={data} />
          </div>
        ) : null}

        {showDesc ? (
          <div
            id={AUTOS_PREVIEW_SECTION_IDS.description}
            className="scroll-mt-28 lg:col-start-1"
            style={{ gridRowStart: descRow, order: orderDesc }}
          >
            <PreviewVehicleDescription data={data} />
          </div>
        ) : null}

        {(data.relatedDealerListings ?? []).length > 0 ? (
          <div
            id={AUTOS_PREVIEW_SECTION_IDS.relatedInventory}
            className="lg:col-start-1"
            style={{ gridRowStart: relatedRow, order: orderRelated }}
          >
            <PreviewRelatedDealerCars
              listings={data.relatedDealerListings ?? []}
              fullInventoryHref={data.relatedDealerInventoryHref}
              hasMore={data.relatedDealerInventoryHasMore}
              previewOnly={relatedPreviewOnly || draftPreviewMode}
            />
          </div>
        ) : null}

        <div className="lg:col-start-1" style={{ gridRowStart: trustRow, order: orderTrust }}>
          <PreviewBuyerTrustStrip lang={lang} />
        </div>
      </div>
    </main>
  );

  if (embeddedInShell) return mainContent;

  return <AutoDealerPreviewChrome editBackHref={editBackHref}>{mainContent}</AutoDealerPreviewChrome>;
}
