/**
 * Gate G2B — Validate global analytics event payloads (auth rules + allowlists).
 */
import { isListingAnalyticsSourceTable } from "@/app/lib/analytics/listingAnalyticsIdentity";
import {
  isListingAnalyticsEventType,
  type ListingAnalyticsEventType,
} from "@/app/lib/listingAnalyticsEventTypes";

export const ANONYMOUS_SAFE_ANALYTICS_EVENTS = new Set<ListingAnalyticsEventType>([
  "listing_view",
  "listing_open",
  "listing_impression",
  "result_card_click",
  "listing_share",
  "listing_like",
  "listing_unlike",
  "cta_click",
  "phone_click",
  "whatsapp_click",
  "email_click",
  "message_click",
  "website_click",
  "directions_click",
  "contact_click",
  "outbound_click",
  "lead_created",
  "apply_started",
  "apply_submitted",
]);

export const AUTH_REQUIRED_ANALYTICS_EVENTS = new Set<ListingAnalyticsEventType>([
  "listing_save",
  "listing_unsave",
  "message_sent",
]);

export type AnalyticsEventPayload = {
  event_type: ListingAnalyticsEventType;
  source_table: string;
  source_id: string;
  category?: string;
  event_source?: string;
  metadata?: Record<string, unknown>;
  anonymous_session_id?: string;
  canonical_ad_id?: string;
};

export type ValidateAnalyticsEventError =
  | "invalid_payload"
  | "invalid_event_type"
  | "invalid_source_table"
  | "auth_required";

export type ValidateAnalyticsEventResult =
  | { ok: true; payload: AnalyticsEventPayload }
  | { ok: false; error: ValidateAnalyticsEventError };

const MAX_METADATA_KEYS = 32;
const MAX_STRING_LEN = 500;

function trim(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Shallow sanitize metadata for jsonb insert. */
export function sanitizeAnalyticsMetadata(input: unknown): Record<string, unknown> {
  if (!isPlainObject(input)) return {};
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [key, value] of Object.entries(input)) {
    if (n >= MAX_METADATA_KEYS) break;
    const k = trim(key);
    if (!k || k.length > 80) continue;
    if (value === null) {
      out[k] = null;
      n++;
      continue;
    }
    const t = typeof value;
    if (t === "string") {
      out[k] = (value as string).slice(0, MAX_STRING_LEN);
      n++;
    } else if (t === "number" && Number.isFinite(value)) {
      out[k] = value;
      n++;
    } else if (t === "boolean") {
      out[k] = value;
      n++;
    }
  }
  return out;
}

export function parseAnalyticsEventBody(body: unknown): ValidateAnalyticsEventResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "invalid_payload" };
  }

  const eventTypeRaw = trim(body.event_type);
  if (!eventTypeRaw || !isListingAnalyticsEventType(eventTypeRaw)) {
    return { ok: false, error: "invalid_event_type" };
  }

  const sourceTable = trim(body.source_table);
  const sourceId = trim(body.source_id);
  if (!sourceTable || !isListingAnalyticsSourceTable(sourceTable)) {
    return { ok: false, error: "invalid_source_table" };
  }
  if (!sourceId) {
    return { ok: false, error: "invalid_payload" };
  }

  const category = trim(body.category) || undefined;
  const event_source = trim(body.event_source) || undefined;
  const anonymous_session_id = trim(body.anonymous_session_id) || undefined;
  const canonical_ad_id = trim(body.canonical_ad_id) || undefined;
  const metadata = sanitizeAnalyticsMetadata(body.metadata);

  return {
    ok: true,
    payload: {
      event_type: eventTypeRaw,
      source_table: sourceTable,
      source_id: sourceId,
      category,
      event_source,
      metadata,
      anonymous_session_id,
      canonical_ad_id,
    },
  };
}

export function assertAnalyticsEventAuth(
  eventType: ListingAnalyticsEventType,
  authenticatedUserId: string | null,
): ValidateAnalyticsEventResult | { ok: true } {
  if (AUTH_REQUIRED_ANALYTICS_EVENTS.has(eventType) && !authenticatedUserId) {
    return { ok: false, error: "auth_required" };
  }
  return { ok: true };
}

export function isAnonymousSafeAnalyticsEvent(eventType: ListingAnalyticsEventType): boolean {
  return ANONYMOUS_SAFE_ANALYTICS_EVENTS.has(eventType);
}
