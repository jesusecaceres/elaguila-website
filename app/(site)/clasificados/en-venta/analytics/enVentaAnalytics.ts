import { trackEnVentaListingViewGlobal, type EnVentaGlobalAnalyticsContext } from "@/app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics";

export type { EnVentaGlobalAnalyticsContext };

/** @deprecated Prefer `trackEnVentaListingViewGlobal` — kept for non–en-venta surfaces still on legacy path. */
export function trackEnVentaListingView(listingId: string, _userId?: string | null) {
  trackEnVentaListingViewGlobal({ listingUuid: listingId });
}

/** Legacy open event — no longer emitted for en-venta global pipeline. */
export function trackEnVentaListingOpen(_listingId: string, _userId?: string | null) {
  /* listing_open omitted: EV1 tracks listing_view via global API */
}

export function trackEnVentaSaveClick(_listingId: string, _userId?: string | null) {
  /* use trackEnVentaSaveGlobal from engagement row */
}

export function trackEnVentaShare(_listingId: string, _userId?: string | null) {
  /* use trackEnVentaListingShareGlobal from engagement row */
}

export function trackEnVentaMessageIntent(_listingId: string, _userId?: string | null) {
  /* reserved — message_sent requires auth via global API */
}

/** Free MVP: hook only — extend `listing_analytics.event_type` before emitting. */
export function trackEnVentaFilterApply(_filterKey: string) {
  /* reserved */
}

export function trackEnVentaPublishSuccess(_listingId: string) {
  /* reserved: no canonical event type yet */
}
