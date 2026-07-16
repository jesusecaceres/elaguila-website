"use client";

import type { AutoDealerListing, VehicleBadge } from "../types/autoDealerListing";
import type { AutosNegociosCopy } from "../lib/autosNegociosCopy";
import {
  hasDescriptionSection,
  hasHeroMedia,
  hasHighlightsSection,
  hasSpecsSection,
  hasTitleBand,
} from "../lib/autoDealerPresence";
import {
  formatCityStateLabel,
  formatCityStateZipLine,
  formatMiles,
  formatStockDisplay,
  formatUsd,
  polishMonthlyEstimateDisplay,
} from "./autoDealerFormatters";
import { AutoGallery } from "./AutoGallery";
import { DealerBusinessStack } from "./DealerBusinessStack";
import { RelatedDealerCars } from "./RelatedDealerCars";
import { VehicleDescription } from "./VehicleDescription";
import { VehicleHighlights } from "./VehicleHighlights";
import { VehicleSpecsGrid } from "./VehicleSpecsGrid";
import { AutoDealerPreviewChrome } from "./AutoDealerPreviewChrome";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosNegociosPreviewEngagementStrip } from "./AutosNegociosPreviewEngagementStrip";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import type { AutosPublicListingAnalyticsProps } from "../../lib/autosAnalyticsIdentity";
import { FiMapPin } from "react-icons/fi";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewBusinessHubShellClass,
  autosPreviewHeroPriceClass,
  autosPreviewHeroTitleClass,
  autosPreviewMainGridClass,
  autosPreviewPageCanvasClass,
  autosPreviewPageMaxWidthClass,
  autosPreviewPremiumCardClass,
  autosPreviewSectionEyebrowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const MAIN_CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;
const COMPACT_BADGE_CLASS =
  "inline-flex items-center rounded-full border border-[#D6C7AD]/80 bg-[#FBF7EF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function badgeLabelFor(t: AutosNegociosCopy, key: VehicleBadge): string {
  return t.taxonomy.badges.find((b) => b.key === key)?.label ?? key;
}

export function AutoDealerPreviewPage({
  data,
  editBackHref,
  publicPlaybackOnly = false,
  publicAnalytics,
  publicUrl,
  relatedPreviewOnly = false,
  embeddedInShell = false,
  draftPreviewMode = false,
  heroSpecItems: _heroSpecItems,
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

  const showUnifiedCanvas = showTitle || showGallery;

  let r = 1;
  const unifiedCanvasRow = showUnifiedCanvas ? r++ : undefined;
  const analyticsRow = showAnalyticsStrip ? r++ : undefined;
  const specsRow = showSpecs ? r++ : undefined;
  const highlightsRow = showHighlights ? r++ : undefined;
  const descRow = showDesc ? r++ : undefined;
  const leftRowCount = r - 1;

  const badges = data.badges ?? [];
  const h1 = data.vehicleTitle?.trim();
  const showMileage = data.mileage !== undefined && Number.isFinite(data.mileage);
  const showLoc = nonEmpty(loc);
  const showStock = nonEmpty(data.stockNumber);
  const showPriceCol = priceOk || nonEmpty(data.monthlyEstimate ?? undefined);

  const showHeaderMeta = showMileage || showStock;

  let ord = 1;
  const orderUnifiedCanvas = showUnifiedCanvas ? ord++ : undefined;
  const orderAnalytics = showAnalyticsStrip ? ord++ : undefined;
  const orderAside = ord++;
  const orderSpecs = showSpecs ? ord++ : undefined;
  const orderHi = showHighlights ? ord++ : undefined;
  const orderDesc = showDesc ? ord++ : undefined;
  const orderRelated = (data.relatedDealerListings ?? []).length > 0 ? ord++ : undefined;

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
            className={`${MAIN_CARD} scroll-mt-28 border-l-[4px] border-l-[#C9A84A] lg:col-start-1 ${
              draftPreviewMode ? "shadow-[0_16px_48px_-16px_rgba(42,36,22,0.16)]" : ""
            }`}
            style={{ gridRowStart: unifiedCanvasRow, order: orderUnifiedCanvas }}
          >
            {draftPreviewMode ? (
              <p className={autosPreviewSectionEyebrowClass}>
                {lang === "es" ? "Vista previa del anuncio" : "Listing preview"}
              </p>
            ) : null}

            {showTitle && (h1 || showPriceCol || showLoc || showHeaderMeta) ? (
              <div
                className={`flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6 ${draftPreviewMode ? "mt-2" : ""}`}
                data-autos-unified-canvas-header="1"
              >
                <div className="min-w-0 max-w-full flex-1 lg:pr-2">
                  {h1 ? <h1 className={`${autosPreviewHeroTitleClass} text-balance`}>{h1}</h1> : null}
                  {showLoc ? (
                    <p className="mt-2 flex min-w-0 items-start gap-1.5 text-sm font-semibold text-[color:var(--lx-text-2)]">
                      <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                      <span className="min-w-0 break-words">{loc}</span>
                    </p>
                  ) : null}
                  {showHeaderMeta ? (
                    <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">
                      {showMileage ? (
                        <span>
                          {pt.mileage} {formatMiles(data.mileage)}
                        </span>
                      ) : null}
                      {showMileage && showStock ? (
                        <span className="mx-2 text-[color:var(--lx-muted)]" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      {showStock ? (
                        <span>
                          {pt.stock} {formatStockDisplay(data.stockNumber)}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                {showPriceCol ? (
                  <div className="min-w-[9.5rem] shrink-0 text-left max-lg:rounded-[14px] max-lg:border max-lg:border-[color:var(--lx-gold-border)]/50 max-lg:bg-[color:var(--lx-nav-hover)] max-lg:px-4 max-lg:py-3 lg:min-w-[10.5rem] lg:text-right">
                    {priceOk ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
                          {pt.priceLabel}
                        </p>
                        <p className={`mt-1 ${autosPreviewHeroPriceClass}`}>{formatUsd(data.price)}</p>
                      </>
                    ) : null}
                    {nonEmpty(data.monthlyEstimate ?? undefined) ? (
                      <p className={`text-sm font-semibold text-[color:var(--lx-text-2)] ${priceOk ? "mt-2" : ""}`}>
                        {polishMonthlyEstimateDisplay(data.monthlyEstimate ?? undefined)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {showSpecs ? (
              <div className={`min-w-0 ${showTitle ? "mt-4 border-t border-[#D6C7AD]/55 pt-4" : ""}`}>
                <VehicleSpecsGrid data={data} variant="canvasStrip" />
              </div>
            ) : null}

            {showGallery ? (
              <div
                className={`min-w-0 ${showTitle || showSpecs ? "mt-4 border-t border-[#D6C7AD]/55 pt-4" : ""}`}
                data-autos-unified-canvas-gallery="1"
              >
                <p className={`${autosPreviewSectionEyebrowClass} mb-3`}>
                  {lang === "es" ? "Galería" : "Gallery"}
                </p>
                <AutoGallery data={data} publicPlaybackOnly={publicPlaybackOnly} embeddedInCanvas />
              </div>
            ) : null}

            {showGallery || badges.length > 0 ? (
              <div
                className="mt-4 border-t border-[#D6C7AD]/55 pt-4"
                data-autos-unified-canvas-utility="1"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  {showGallery ? (
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
                  ) : (
                    <span />
                  )}
                  {badges.length > 0 ? (
                    <div className="min-w-0 sm:max-w-[55%] sm:text-right">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">
                        {lang === "es" ? "Destacados" : "Highlights"}
                      </p>
                      <ul className="flex flex-wrap gap-1.5 sm:justify-end">
                        {badges.map((b) => (
                          <li key={b} className={COMPACT_BADGE_CLASS}>
                            {badgeLabelFor(t, b)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
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
            className="autos-negocios-preview-dealer-aside flex min-w-0 scroll-mt-28 flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:self-start"
            style={{
              gridRowStart: leftRowCount > 0 ? 1 : undefined,
              gridRowEnd: leftRowCount > 0 ? `span ${leftRowCount}` : undefined,
              order: orderAside,
            }}
          >
            <div className={`${autosPreviewBusinessHubShellClass} lg:sticky lg:top-28`}>
              <DealerBusinessStack
                data={data}
                buyerInventoryHref={publicPlaybackOnly ? data.relatedDealerInventoryHref : undefined}
                publicAnalytics={publicAnalytics}
                showPremiumHubHeader={draftPreviewMode || publicPlaybackOnly}
                className="rounded-none border-0 bg-transparent p-0 shadow-none"
              />
            </div>
          </aside>

          {showSpecs ? (
            <div id={AUTOS_PREVIEW_SECTION_IDS.specs} className="scroll-mt-28 lg:col-start-1" style={{ gridRowStart: specsRow, order: orderSpecs }}>
              <VehicleSpecsGrid data={data} />
            </div>
          ) : null}

          {showHighlights ? (
            <div id={AUTOS_PREVIEW_SECTION_IDS.highlights} className="scroll-mt-28 lg:col-start-1" style={{ gridRowStart: highlightsRow, order: orderHi }}>
              <VehicleHighlights data={data} />
            </div>
          ) : null}

          {showDesc ? (
            <div id={AUTOS_PREVIEW_SECTION_IDS.description} className="scroll-mt-28 lg:col-start-1" style={{ gridRowStart: descRow, order: orderDesc }}>
              <VehicleDescription data={data} />
            </div>
          ) : null}

          {(data.relatedDealerListings ?? []).length > 0 ? (
            <div className="lg:col-start-1" style={{ order: orderRelated }}>
              <RelatedDealerCars
                listings={data.relatedDealerListings ?? []}
                fullInventoryHref={data.relatedDealerInventoryHref}
                hasMore={data.relatedDealerInventoryHasMore}
                previewOnly={relatedPreviewOnly || draftPreviewMode}
              />
            </div>
          ) : null}
        </div>
      </main>
  );

  if (embeddedInShell) return mainContent;

  return <AutoDealerPreviewChrome editBackHref={editBackHref}>{mainContent}</AutoDealerPreviewChrome>;
}
