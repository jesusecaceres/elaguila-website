import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "./listingLifecycleConfig";

export type ListingExpirationReminderType = "before_7d" | "before_3d" | "before_1d" | "expires_today" | "after_3d";

export type ListingExpirationReminderEvent = {
  listingId: string;
  leonixAdId: string | null;
  ownerId: string | null;
  category: string;
  packageKey: string;
  expiresAtIso: string;
  reminderType: ListingExpirationReminderType;
  scheduledForIso: string;
  sentAtIso: string | null;
  channel: "dashboard" | "email";
  deliveryStatus: "pending" | "sent" | "skipped" | "failed";
  dedupeKey: string;
  error: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function reminderTypeForOffset(days: number): ListingExpirationReminderType {
  if (days === 7) return "before_7d";
  if (days === 3) return "before_3d";
  if (days === 1) return "before_1d";
  if (days === 0) return "expires_today";
  return "after_3d";
}

export function buildListingExpirationReminderEvents(input: {
  listingId: string;
  leonixAdId?: string | null;
  ownerId?: string | null;
  category: "rentas";
  packageKey: "rentas_30d";
  expiresAtIso: string;
  channels?: readonly ("dashboard" | "email")[];
}): ListingExpirationReminderEvent[] {
  const expiresMs = new Date(input.expiresAtIso).getTime();
  if (!Number.isFinite(expiresMs)) return [];
  const channels = input.channels?.length ? input.channels : (["dashboard", "email"] as const);
  const events: ListingExpirationReminderEvent[] = [];
  for (const offset of RENTAS_LISTING_LIFECYCLE_CONFIG.reminderScheduleDays) {
    const scheduledMs = expiresMs - offset * DAY_MS;
    const type = reminderTypeForOffset(offset);
    for (const channel of channels) {
      events.push({
        listingId: input.listingId,
        leonixAdId: input.leonixAdId ?? null,
        ownerId: input.ownerId ?? null,
        category: input.category,
        packageKey: input.packageKey,
        expiresAtIso: new Date(expiresMs).toISOString(),
        reminderType: type,
        scheduledForIso: new Date(scheduledMs).toISOString(),
        sentAtIso: null,
        channel,
        deliveryStatus: "pending",
        dedupeKey: `${input.category}:${input.listingId}:${type}:${channel}`,
        error: null,
      });
    }
  }
  return events;
}

export function rentasExpirationReminderCopy(type: ListingExpirationReminderType, lang: "es" | "en"): string {
  const days = type === "before_7d" ? 7 : type === "before_3d" ? 3 : type === "before_1d" ? 1 : null;
  if (days != null) {
    return lang === "es"
      ? `Tu anuncio de Rentas vence en ${days} día${days === 1 ? "" : "s"}.`
      : `Your Rentas listing expires in ${days} day${days === 1 ? "" : "s"}.`;
  }
  if (type === "expires_today") {
    return lang === "es" ? "Tu anuncio de Rentas vence hoy." : "Your Rentas listing expires today.";
  }
  return lang === "es"
    ? "Tu anuncio de Rentas expiró hace 3 días. Puedes renovarlo desde Mis anuncios."
    : "Your Rentas listing expired 3 days ago. You can renew it from My listings.";
}
