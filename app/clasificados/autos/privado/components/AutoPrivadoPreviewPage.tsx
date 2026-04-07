"use client";

import type { AutoDealerListing, VehicleBadge } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import {
  hasDescriptionSection,
  hasHeroMedia,
  hasHighlightsSection,
  hasSpecsSection,
  hasTitleBand,
} from "@/app/clasificados/autos/negocios/lib/autoDealerPresence";
import {
  formatCityStateLabel,
  formatMiles,
  formatStockDisplay,
  formatUsd,
  formatVinDisplay,
  polishMonthlyEstimateDisplay,
} from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import { AutoGallery } from "@/app/clasificados/autos/negocios/components/AutoGallery";
import { VehicleDescription } from "@/app/clasificados/autos/negocios/components/VehicleDescription";
import { VehicleHighlights } from "@/app/clasificados/autos/negocios/components/VehicleHighlights";
import { VehicleSpecsGrid } from "@/app/clasificados/autos/negocios/components/VehicleSpecsGrid";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import { AUTOS_LISTING_ANALYTICS_DRAFT_DEMO } from "@/app/clasificados/autos/shared/types/autosListingAnalytics";
import { PrivadoContactStrip } from "./PrivadoContactStrip";
import { PrivadoPreviewChrome } from "./PrivadoPreviewChrome";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";

const MAIN_CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-5";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function badgeLabelFor(t: AutosNegociosCopy, key: VehicleBadge): string {
  return t.taxonomy.badges.find((b) => b.key === key)?.label ?? key;
}

export function AutoPrivadoPreviewPage({ data, editBackHref }: { data: AutoDealerListing; editBackHref?: string }) {
  const { lang, t } = useAutosPrivadoPreviewCopy();
  const pt = t.preview.title;
  const sb = t.preview.sidebar;
  const pa = t.preview.analytics;

  const loc = formatCityStateLabel(data.city, data.state);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const showTitle = hasTitleBand(data);
  const showGallery = hasHeroMedia(data);
  const showSpecs = hasSpecsSection(data);
  const showHighlights = hasHighlightsSection(data);
  const showDesc = hasDescriptionSection(data);

  const showAnalyticsStrip = showTitle || showGallery;
  const analyticsMetrics = data.listingAnalytics ?? AUTOS_LISTING_ANALYTICS_DRAFT_DEMO;

  const badges = data.badges ?? [];
  const h1 = data.vehicleTitle?.trim();
  const showMileage = data.mileage !== undefined && Number.isFinite(data.mileage);
  const showLoc = nonEmpty(loc);
  const showVin = nonEmpty(data.vin);
  const showStock = nonEmpty(data.stockNumber);
  const showMeta = showMileage || showLoc || showVin || showStock;
  const showLeft = Boolean(h1) || badges.length > 0 || showMeta;
  const showPriceCol = priceOk || nonEmpty(data.monthlyEstimate ?? undefined);

  return (
    <PrivadoPreviewChrome editBackHref={editBackHref}>
      <main className="mx-auto mt-6 max-w-[1280px] overflow-x-hidden px-4 sm:mt-8 md:px-5 lg:px-6">
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          {showTitle ? (
            <section className={`${MAIN_CARD} lg:col-span-12`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                {showLeft ? (
                  <div className="min-w-0 max-w-full flex-1">
                    <div className="mb-3 inline-flex rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
                      {lang === "es" ? "Privado" : "Private"}
                    </div>
                    {h1 ? (
                      <h1 className="text-2xl font-bold leading-[1.15] tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-[1.85rem]">
                        {h1}
                      </h1>
                    ) : null}
                    {badges.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {badges.map((b) => (
                          <li
                            key={b}
                            className="rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text-2)]"
                          >
                            {badgeLabelFor(t, b)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {showMeta ? (
                      <dl className="mt-4 grid gap-2 text-sm text-[color:var(--lx-text-2)] sm:grid-cols-2">
                        {showMileage ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">{pt.mileage}</dt>
                            <dd className="font-semibold">{formatMiles(data.mileage)}</dd>
                          </div>
                        ) : null}
                        {showLoc ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">{pt.location}</dt>
                            <dd className="font-semibold">{loc}</dd>
                          </div>
                        ) : null}
                        {showVin ? (
                          <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2">
                            <dt className="shrink-0 text-[color:var(--lx-muted)]">{pt.vin}</dt>
                            <dd className="min-w-0 break-all font-mono text-[13px] font-semibold tracking-wide">{formatVinDisplay(data.vin)}</dd>
                          </div>
                        ) : null}
                        {showStock ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">{pt.stock}</dt>
                            <dd className="font-semibold">{formatStockDisplay(data.stockNumber)}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </div>
                ) : null}
                {showPriceCol ? (
                  <div
                    className={`min-w-0 shrink-0 text-left lg:text-right ${showLeft ? "border-t border-[color:var(--lx-nav-border)] pt-4 lg:border-t-0 lg:pt-0" : ""}`}
                  >
                    {priceOk ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{pt.priceLabel}</p>
                        <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
                          {formatUsd(data.price)}
                        </p>
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
            </section>
          ) : null}

          {showGallery ? (
            <div className="lg:col-span-12">
              <AutoGallery data={data} />
            </div>
          ) : null}

          {showAnalyticsStrip ? (
            <div className="lg:col-span-12">
              <AutosListingAnalyticsRow
                metrics={analyticsMetrics}
                labels={{
                  kicker: pa.kicker,
                  views: pa.views,
                  saves: pa.saves,
                  shares: pa.shares,
                  contacts: pa.contacts,
                  footnote: pa.footnote,
                }}
              />
            </div>
          ) : null}

          <div className="lg:col-span-7 lg:col-start-1">
            {showSpecs ? <VehicleSpecsGrid data={data} /> : null}
            {showHighlights ? (
              <div className={showSpecs ? "mt-6" : ""}>
                <VehicleHighlights data={data} />
              </div>
            ) : null}
            {showDesc ? (
              <div className={showSpecs || showHighlights ? "mt-6" : ""}>
                <VehicleDescription data={data} />
              </div>
            ) : null}
          </div>

          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:self-start">
            <PrivadoContactStrip
              data={data}
              labels={{
                call: sb.call,
                whatsapp: sb.whatsappCta,
                seller: lang === "es" ? "Vendedor" : "Seller",
              }}
            />
          </aside>
        </div>
      </main>
    </PrivadoPreviewChrome>
  );
}
