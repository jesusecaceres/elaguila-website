/**
 * Globalization Build 03 (Gate 25) — endorsement vote analytics. Reuses the one real backend sink
 * (`recordAnalyticsEvent` -> `/api/analytics/events` -> `public.listing_analytics`) rather than
 * inventing a parallel analytics stack. `leonix_endorsement_add`/`leonix_endorsement_remove` are
 * genuinely new event types (a vote is not a click on an external destination, so no existing CTA
 * event type fits) — added to the shared allowlist in this same build
 * (`app/lib/listingAnalyticsEventTypes.ts` + the migration's CHECK widening), not silently
 * repurposing an existing one.
 *
 * The database vote row remains the source of count truth — this is best-effort telemetry only,
 * never awaited by the toggle UI in a way that could block or fail the real vote.
 */
import { recordAnalyticsEvent } from "@/app/lib/analytics/client/recordAnalyticsEvent";
import type { LeonixEndorsementCategory } from "./leonixEndorsementRegistry";

const SOURCE_TABLE_BY_CATEGORY: Record<LeonixEndorsementCategory, string> = {
  servicios: "servicios_public_listings",
  restaurantes: "restaurantes_public_listings",
};

export function trackLeonixEndorsementToggle(input: {
  category: LeonixEndorsementCategory;
  targetId: string;
  endorsementKey: string;
  active: boolean;
  surface: string;
  accessToken?: string | null;
}): void {
  void recordAnalyticsEvent({
    event_type: input.active ? "leonix_endorsement_add" : "leonix_endorsement_remove",
    source_table: SOURCE_TABLE_BY_CATEGORY[input.category],
    source_id: input.targetId,
    category: input.category,
    event_source: input.surface,
    metadata: { endorsement_key: input.endorsementKey },
    accessToken: input.accessToken ?? null,
  }).catch(() => {
    /* analytics is never count truth and must never disrupt the vote itself */
  });
}
