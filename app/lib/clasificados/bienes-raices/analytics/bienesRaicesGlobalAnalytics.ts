/**
 * Bienes Raíces analytics adapter — re-exports the category global tracker.
 * Prefer this path for new Bienes engagement wiring; implementation lives in brGlobalAnalytics.
 */
export {
  brAnalyticsContextFromListing,
  trackBrBrochureClickGlobal,
  trackBrContactClickGlobal,
  trackBrDirectionsClickGlobal,
  trackBrEmailClickGlobal,
  trackBrFloorPlanClickGlobal,
  trackBrGoogleBusinessClickGlobal,
  trackBrGoogleReviewsClickGlobal,
  trackBrLikeGlobal,
  trackBrListingOpenGlobal,
  trackBrListingShareGlobal,
  trackBrListingViewGlobal,
  trackBrMessageClickGlobal,
  trackBrMlsClickGlobal,
  trackBrPhoneClickGlobal,
  trackBrReportSubmitGlobal,
  trackBrRequestInfoClickGlobal,
  trackBrResultCardClickGlobal,
  trackBrScheduleVisitClickGlobal,
  trackBrSimilarListingClickGlobal,
  trackBrTourVideoClickGlobal,
  trackBrWebsiteClickGlobal,
  trackBrWhatsAppClickGlobal,
  trackBrYelpClickGlobal,
  type BrContactAnalyticsKind,
  type BrGlobalAnalyticsContext,
} from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";
