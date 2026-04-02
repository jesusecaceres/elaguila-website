import type { AutoDealerListing } from "../types/autoDealerListing";
import {
  hasDescriptionSection,
  hasHeroMedia,
  hasHighlightsSection,
  hasSpecsSection,
  hasTitleBand,
} from "../lib/autoDealerPresence";
import {
  formatCityStateLabel,
  formatMiles,
  formatStockDisplay,
  formatUsd,
  formatVinDisplay,
  polishMonthlyEstimateDisplay,
} from "./autoDealerFormatters";
import { AutoGallery } from "./AutoGallery";
import { AutoSidebarCTA } from "./AutoSidebarCTA";
import { DealerInfoCard } from "./DealerInfoCard";
import { RelatedDealerCars } from "./RelatedDealerCars";
import { VehicleDescription } from "./VehicleDescription";
import { VehicleHighlights } from "./VehicleHighlights";
import { VehicleSpecsGrid } from "./VehicleSpecsGrid";
import { VEHICLE_BADGE_LABEL } from "./vehicleBadgeLabels";
import { AutoDealerPreviewChrome } from "./AutoDealerPreviewChrome";

const MAIN_CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-5";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function AutoDealerPreviewPage({
  data,
  editBackHref,
}: {
  data: AutoDealerListing;
  /** Subtle return link to the listing editor (e.g. Publicar flow). */
  editBackHref?: string;
}) {
  const loc = formatCityStateLabel(data.city, data.state);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const showTitle = hasTitleBand(data);
  const showGallery = hasHeroMedia(data);
  const showSpecs = hasSpecsSection(data);
  const showHighlights = hasHighlightsSection(data);
  const showDesc = hasDescriptionSection(data);

  let r = 1;
  const titleRow = showTitle ? r++ : undefined;
  const galleryRow = showGallery ? r++ : undefined;
  const specsRow = showSpecs ? r++ : undefined;
  const highlightsRow = showHighlights ? r++ : undefined;
  const descRow = showDesc ? r++ : undefined;
  const leftRowCount = r - 1;

  const badges = data.badges ?? [];
  const h1 = data.vehicleTitle?.trim();
  const showMileage = data.mileage !== undefined && Number.isFinite(data.mileage);
  const showLoc = nonEmpty(loc);
  const showVin = nonEmpty(data.vin);
  const showStock = nonEmpty(data.stockNumber);
  const showMeta = showMileage || showLoc || showVin || showStock;
  const showLeft = Boolean(h1) || badges.length > 0 || showMeta;
  const showPriceCol = priceOk || nonEmpty(data.monthlyEstimate ?? undefined);

  let ord = 1;
  const orderTitle = showTitle ? ord++ : undefined;
  const orderGallery = showGallery ? ord++ : undefined;
  const orderAside = ord++;
  const orderSpecs = showSpecs ? ord++ : undefined;
  const orderHi = showHighlights ? ord++ : undefined;
  const orderDesc = showDesc ? ord++ : undefined;

  return (
    <AutoDealerPreviewChrome editBackHref={editBackHref}>
      <main className="mx-auto mt-8 max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          {showTitle ? (
            <section
              className={`${MAIN_CARD} lg:col-span-7 lg:col-start-1`}
              style={{ gridRowStart: titleRow, order: orderTitle }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                {showLeft ? (
                  <div className="min-w-0 flex-1">
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
                            {VEHICLE_BADGE_LABEL[b]}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {showMeta ? (
                      <dl className="mt-4 grid gap-2 text-sm text-[color:var(--lx-text-2)] sm:grid-cols-2">
                        {showMileage ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">Millaje</dt>
                            <dd className="font-semibold">{formatMiles(data.mileage)}</dd>
                          </div>
                        ) : null}
                        {showLoc ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">Ubicación</dt>
                            <dd className="font-semibold">{loc}</dd>
                          </div>
                        ) : null}
                        {showVin ? (
                          <div className="flex flex-wrap gap-2 sm:col-span-2">
                            <dt className="text-[color:var(--lx-muted)]">VIN</dt>
                            <dd className="font-mono text-[13px] font-semibold tracking-wide">{formatVinDisplay(data.vin)}</dd>
                          </div>
                        ) : null}
                        {showStock ? (
                          <div className="flex gap-2">
                            <dt className="text-[color:var(--lx-muted)]">N.º de stock</dt>
                            <dd className="font-semibold">{formatStockDisplay(data.stockNumber)}</dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </div>
                ) : null}
                {showPriceCol ? (
                  <div
                    className={`shrink-0 text-left lg:text-right ${showLeft ? "border-t border-[color:var(--lx-nav-border)] pt-4 lg:border-t-0 lg:pt-0" : ""}`}
                  >
                    {priceOk ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">Precio</p>
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
            <div className="lg:col-span-7 lg:col-start-1" style={{ gridRowStart: galleryRow, order: orderGallery }}>
              <AutoGallery data={data} />
            </div>
          ) : null}

          <aside
            className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8 lg:self-start"
            style={{
              gridRowStart: leftRowCount > 0 ? 1 : undefined,
              gridRowEnd: leftRowCount > 0 ? `span ${leftRowCount}` : undefined,
              order: orderAside,
            }}
          >
            <AutoSidebarCTA data={data} />
            <DealerInfoCard data={data} />
          </aside>

          {showSpecs ? (
            <div className="lg:col-span-7 lg:col-start-1" style={{ gridRowStart: specsRow, order: orderSpecs }}>
              <VehicleSpecsGrid data={data} />
            </div>
          ) : null}

          {showHighlights ? (
            <div className="lg:col-span-7 lg:col-start-1" style={{ gridRowStart: highlightsRow, order: orderHi }}>
              <VehicleHighlights data={data} />
            </div>
          ) : null}

          {showDesc ? (
            <div className="lg:col-span-7 lg:col-start-1" style={{ gridRowStart: descRow, order: orderDesc }}>
              <VehicleDescription data={data} />
            </div>
          ) : null}
        </div>

        {(data.relatedDealerListings ?? []).length > 0 ? (
          <div className="mt-6">
            <RelatedDealerCars listings={data.relatedDealerListings ?? []} />
          </div>
        ) : null}
      </main>
    </AutoDealerPreviewChrome>
  );
}
