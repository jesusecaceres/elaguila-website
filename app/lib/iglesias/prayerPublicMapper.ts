import { PRAYER_PUBLIC_STATUSES, type PrayerVisibility } from "./prayerTaxonomy";
import type { PrayerPublicCard, PrayerRequestRow, PrayerStatus } from "./prayerTypes";

const PUBLIC_VIS: ReadonlySet<string> = new Set(["PUBLIC_NAMED", "PUBLIC_ANONYMOUS"]);
const PUBLIC_STATUS: ReadonlySet<string> = new Set(PRAYER_PUBLIC_STATUSES);

export const PUBLIC_PRAYER_FORBIDDEN_KEYS = [
  "submitter_user_id",
  "anonymous_session_hash",
  "session_hash",
  "ip",
  "ip_hash",
  "email",
  "phone",
  "whatsapp",
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "contact_consent",
  "preferred_contact_method",
  "ai_decision",
  "ai_reason_codes",
  "reason_codes",
  "moderation_status",
  "moderation_reason",
  "body_normalized",
  "body_original_internal",
  "contains_private_info",
  "contains_third_party_pii",
  "contains_spam",
  "contains_threat",
  "contains_hate",
  "contains_self_harm_signal",
  "contains_imminent_violence_signal",
  "risk_level",
] as const;

export function isPubliclyListablePrayer(row: {
  visibility: string;
  moderation_status: string;
  status: string;
  published_at: string | null;
}): boolean {
  return (
    PUBLIC_VIS.has(row.visibility) &&
    row.moderation_status === "CLEARLY_SAFE" &&
    PUBLIC_STATUS.has(row.status) &&
    !!row.published_at
  );
}

function anonymousLabel(language: string): string {
  return language === "en" ? "Anonymous" : "Anónimo";
}

/**
 * Maps a stored prayer row to the ONLY shape the public wall / public GET may return.
 * Private contact, identity, session, IP, and AI internals are dropped — never nested in JSON.
 */
export function mapPublicPrayer(input: {
  row: Pick<
    PrayerRequestRow,
    | "id"
    | "visibility"
    | "language"
    | "city"
    | "category"
    | "display_name"
    | "body"
    | "status"
    | "created_at"
    | "moderation_status"
    | "published_at"
  >;
  acknowledgementCount: number;
  latestUpdate: PrayerPublicCard["latestUpdate"];
  owned: boolean;
  acknowledgedByViewer: boolean;
}): PrayerPublicCard | null {
  const { row } = input;
  if (!isPubliclyListablePrayer(row)) return null;
  if (row.visibility !== "PUBLIC_NAMED" && row.visibility !== "PUBLIC_ANONYMOUS") return null;

  const anonymous = row.visibility === "PUBLIC_ANONYMOUS";
  const displayName = anonymous
    ? anonymousLabel(row.language)
    : row.display_name?.trim() || anonymousLabel(row.language);

  return {
    id: row.id,
    visibility: row.visibility,
    language: row.language,
    city: row.city?.trim() || null,
    category: row.category,
    displayName,
    anonymous,
    body: row.body,
    status: row.status as PrayerStatus,
    createdAt: row.created_at,
    acknowledgementCount: Math.max(0, Math.floor(input.acknowledgementCount) || 0),
    latestUpdate: input.latestUpdate,
    owned: input.owned === true,
    acknowledgedByViewer: input.acknowledgedByViewer === true,
  };
}

export function publicPrayerHasForbiddenKeys(payload: unknown): string[] {
  const found: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${k}` : k;
      if ((PUBLIC_PRAYER_FORBIDDEN_KEYS as readonly string[]).includes(k)) found.push(next);
      walk(v, next);
    }
  };
  walk(payload, "");
  return found;
}

export function visibilityIsPrivate(visibility: PrayerVisibility | string): boolean {
  return visibility === "PRIVATE_PRAYER_TEAM";
}
