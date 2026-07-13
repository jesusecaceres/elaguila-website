/**
 * A5.LAUNCH-READINESS-02 — Per-listing dashboard analytics href for autos_classifieds_listings rows.
 */
import type { AutosDealerPublishSuccessLang } from "./autosDealerPublishSuccessCopy";

export function autosPaidListingAnalyticsHref(input: {
  listingId: string;
  lang: AutosDealerPublishSuccessLang;
  leonixAdId?: string | null;
}): string {
  const listingId = input.listingId.trim();
  const q = new URLSearchParams({
    source_table: "autos_classifieds_listings",
    source_id: listingId,
    category: "autos",
    lang: input.lang,
  });
  const leonix = input.leonixAdId?.trim();
  if (leonix) q.set("canonical_ad_id", leonix);
  return `/dashboard/analytics/listing?${q.toString()}`;
}
