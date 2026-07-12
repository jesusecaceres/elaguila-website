"use client";

import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  hasDescriptionSection,
  hasHeroMedia,
  hasHighlightsSection,
  hasSpecsSection,
  hasTitleBand,
} from "@/app/clasificados/autos/negocios/lib/autoDealerPresence";
import {
  formatCityStateZipLine,
  formatMiles,
  formatUsd,
  formatVinDisplay,
} from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import { AutoGallery } from "@/app/clasificados/autos/negocios/components/AutoGallery";
import { PrivadoVehicleDescription } from "./PrivadoVehicleDescription";
import { PrivadoVehicleHighlights } from "./PrivadoVehicleHighlights";
import { VehicleSpecsGrid } from "@/app/clasificados/autos/negocios/components/VehicleSpecsGrid";
import { AutosEngagementRow } from "@/app/clasificados/autos/shared/components/AutosEngagementRow";
import { AutosListingAnalyticsRow } from "@/app/clasificados/autos/shared/components/AutosListingAnalyticsRow";
import { PrivadoContactStrip } from "./PrivadoContactStrip";
import { PrivadoPreviewChrome } from "./PrivadoPreviewChrome";
import { PrivadoPreviewPromiseTiles } from "./PrivadoPreviewPromiseTiles";
import { PrivadoQuickPreviewCard } from "./PrivadoQuickPreviewCard";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";
import { buildVehicleTitle, normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { withNormalizedVehicleIdentityForDisplay } from "@/app/lib/clasificados/autos/autosListingDisplayIdentity";
import type { AutosPublicListingAnalyticsProps } from "../../lib/autosAnalyticsIdentity";

const MAIN_CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function AutoPrivadoPreviewPage({
  data,
  editBackHref,
  publicPlaybackOnly = false,
  publicAnalytics,
  publicUrl,
}: {
  data: AutoDealerListing;
  editBackHref?: string;
  publicPlaybackOnly?: boolean;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  publicUrl?: string;
}) {
  const { lang, t } = useAutosPrivadoPreviewCopy();
  const pt = t.preview.title;
  const sb = t.preview.sidebar;
  const pa = t.preview.analytics;

  const display = withNormalizedVehicleIdentityForDisplay(data);
  const canonicalTitle = buildVehicleTitle(display.year, display.make, display.model, display.trim).trim();
  const ymmtParts: string[] = [];
  if (display.year != null && Number.isFinite(display.year)) ymmtParts.push(String(Math.round(display.year)));
  const mk = normalizeVehicleSegment(display.make);
  const md = normalizeVehicleSegment(display.model);
  const tr = normalizeVehicleSegment(display.trim);
  if (mk) ymmtParts.push(mk);
  if (md) ymmtParts.push(md);
  if (tr) ymmtParts.push(tr);
  const ymmtLine = ymmtParts.join(" · ");

  const loc = formatCityStateZipLine(display.city, display.state, display.zip);
  const priceOk = display.price !== undefined && Number.isFinite(display.price);
  const showTitle = hasTitleBand(display) || nonEmpty(display.zip) || Boolean(canonicalTitle);
  const showGallery = hasHeroMedia(display);
  const showSpecs = hasSpecsSection(display);
  const showHighlights = hasHighlightsSection(display);
  const showDesc = hasDescriptionSection(display);

  const liveMetrics = display.listingAnalytics;
  const showAnalyticsStrip = !publicPlaybackOnly && Boolean(liveMetrics) && (showTitle || showGallery);

  const h1 = canonicalTitle || display.vehicleTitle?.trim();
  const showYmmtSubline = Boolean(ymmtLine) && !canonicalTitle;
  const showMileage = display.mileage !== undefined && Number.isFinite(display.mileage);
  const showLoc = nonEmpty(loc);
  const showVin = nonEmpty(display.vin);
  const showMeta = showMileage || showLoc || showVin;
  const showLeft = Boolean(h1) || showYmmtSubline || showMeta;
  const showPriceCol = priceOk;

  return (
    <PrivadoPreviewChrome
      lang={lang}
      labels={{
        breadcrumbClassifieds: t.preview.chrome.breadcrumbClassifieds,
        breadcrumbAutos: t.preview.chrome.breadcrumbAutos,
        breadcrumbTail: lang === "es" ? "Privado" : "Private",
        backToEdit: t.preview.chrome.backToEdit,
      }}
      editBackHref={editBackHref}
    >
      <main className="mx-auto mt-8 max-w-[1440px] overflow-x-hidden px-[max(1rem,env(safe-area-inset-left))] pb-12 pr-[max(1rem,env(safe-area-inset-right))] pt-2 sm:mt-10 sm:pb-16 md:px-5 lg:px-6">
        {/* Single premium framed card */}
        <div className={MAIN_CARD}>
          {/* Breadcrumb row */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[color:var(--lx-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <span className="font-medium text-[color:var(--lx-text-2)]">
                  {lang === "es" ? "Vista previa" : "Preview"}
                </span>
              </li>
              <li aria-hidden className="text-[color:var(--lx-muted)]">
                /
              </li>
              <li>
                <span className="font-medium text-[color:var(--lx-text-2)]">
                  {lang === "es" ? "Privado" : "Private"}
                </span>
              </li>
              <li aria-hidden className="text-[color:var(--lx-muted)]">
                /
              </li>
              <li>
                <span className="font-semibold text-[color:var(--lx-text)]">
                  {lang === "es" ? "Autos" : "Autos"}
                </span>
              </li>
            </ol>
          </nav>

          {/* Centered preview label */}
          <div className="mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">
              {lang === "es" ? "VISTA PREVIA DEL ANUNCIO" : "LISTING PREVIEW"}
            </p>
          </div>

          {/* Title and location row */}
          {showTitle ? (
            <div className="mb-8">
              {h1 ? (
                <h1 className="mb-3 text-pretty font-serif text-4xl font-extrabold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-5xl md:text-6xl">
                  {h1}
                </h1>
              ) : null}
              {showLoc ? (
                <div className="flex items-center gap-2 text-sm text-[color:var(--lx-text-2)]">
                  <span>{loc}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Price and facts row */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {priceOk ? (
              <div>
                <p className="text-pretty text-4xl font-extrabold leading-none tracking-tight text-[#7A1E2C] sm:text-5xl md:text-6xl">
                  {formatUsd(display.price)}
                </p>
              </div>
            ) : null}
            {showMeta ? (
              <div className="flex flex-wrap gap-4 text-sm text-[color:var(--lx-text-2)]">
                {showMileage ? (
                  <div>
                    <span className="text-[color:var(--lx-muted)]">{pt.mileage}:</span>{" "}
                    <span className="font-semibold">{formatMiles(display.mileage)}</span>
                  </div>
                ) : null}
                {showVin ? (
                  <div>
                    <span className="text-[color:var(--lx-muted)]">{pt.vin}:</span>{" "}
                    <span className="font-mono font-semibold">{formatVinDisplay(display.vin)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Gallery and contact grid */}
          <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Left: Gallery and details */}
            <div className="min-w-0 flex flex-col gap-8">
              {showGallery ? (
                <div>
                  <AutoGallery data={display} publicPlaybackOnly={publicPlaybackOnly} />
                </div>
              ) : null}

              {showAnalyticsStrip && liveMetrics ? (
                <AutosListingAnalyticsRow
                  variant="compact"
                  metrics={liveMetrics}
                  labels={{
                    kicker: pa.kicker,
                    views: pa.views,
                    saves: pa.saves,
                    shares: pa.shares,
                    contacts: pa.contacts,
                    footnote: publicPlaybackOnly ? undefined : pa.footnote,
                  }}
                />
              ) : null}

              {showSpecs ? <VehicleSpecsGrid data={display} hiddenRowKeys={["stock"]} /> : null}
              {showHighlights ? (
                <div className={showSpecs ? "mt-8" : ""}>
                  <PrivadoVehicleHighlights data={display} />
                </div>
              ) : null}
              {showDesc ? (
                <div className={showSpecs || showHighlights ? "mt-8" : ""}>
                  <PrivadoVehicleDescription data={display} />
                </div>
              ) : null}
            </div>

            {/* Right: Contact card */}
            <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
              {publicPlaybackOnly && publicAnalytics?.listingSourceId ? (
                <AutosEngagementRow
                  listingSourceId={publicAnalytics.listingSourceId}
                  leonixAdId={publicAnalytics.leonixAdId}
                  lang={lang}
                  listingTitle={h1}
                  listingUrl={publicUrl}
                  likeCount={liveMetrics?.likes}
                />
              ) : null}
              <PrivadoContactStrip
                data={display}
                lang={lang}
                publicAnalytics={publicAnalytics}
                labels={{
                  call: sb.call,
                  whatsapp: sb.whatsappCta,
                  messageSite: sb.messageSite,
                  emailSeller: sb.emailSeller,
                  sms: lang === "es" ? "Enviar SMS" : "Text seller",
                  sellerHeading: lang === "es" ? "Contactar vendedor" : "Contact seller",
                  seller: lang === "es" ? "Vendedor privado" : "Private seller",
                  safetyNote:
                    lang === "es"
                      ? "Usa lugares públicos y seguros para revisar el vehículo."
                      : "Meet in a safe public place when checking the vehicle.",
                  publishedOnLeonix: lang === "es" ? "Publicado en Leonix" : "Published on Leonix",
                }}
              />
            </aside>
          </div>
        </div>

        {/* Quick preview card */}
        <section className="mx-auto mt-8 max-w-[1440px] px-4 md:px-5 lg:px-6">
          <PrivadoQuickPreviewCard data={display} />
        </section>

        <PrivadoPreviewPromiseTiles lang={lang} />
      </main>
    </PrivadoPreviewChrome>
  );
}
