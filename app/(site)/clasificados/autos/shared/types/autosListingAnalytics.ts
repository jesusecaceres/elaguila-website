/**
 * Engagement snapshot for Autos listing shells (Negocios preview, Privado preview, future live detail).
 * Dashboard `listing_analytics` rows map here conceptually: views ≈ listing_view, contacts ≈ message_sent, etc.
 */
export type AutosListingAnalyticsSnapshot = {
  views: number;
  /** Distinct signed-in viewers when available; optional in draft shell. */
  uniqueViews?: number;
  saves: number;
  shares: number;
  /** Inquiry taps / messages — “Contactos” on surface. */
  contacts: number;
  /** Scaffold for future event streams (not wired to DB in this phase). */
  whatsappClicks?: number;
  websiteClicks?: number;
  appointmentClicks?: number;
  profileClicks?: number;
};

/** Safe demo values for draft preview before publish plumbing (non-fake in production when omitted). */
export const AUTOS_LISTING_ANALYTICS_DRAFT_DEMO: AutosListingAnalyticsSnapshot = {
  views: 24,
  uniqueViews: 18,
  saves: 5,
  shares: 2,
  contacts: 3,
};

/** Roll up raw `listing_analytics` rows (same rules as dashboard `mis-anuncios`). */
export function aggregateRawListingAnalyticsEvents(
  events: ReadonlyArray<{ event_type: string; user_id?: string | null }>,
): AutosListingAnalyticsSnapshot {
  let views = 0;
  let saves = 0;
  let shares = 0;
  let contacts = 0;
  const viewUserIds = new Set<string>();
  for (const e of events) {
    const t = e.event_type;
    if (t === "listing_view") {
      views += 1;
      if (e.user_id) viewUserIds.add(e.user_id);
    } else if (t === "listing_save") saves += 1;
    else if (t === "listing_share") shares += 1;
    else if (t === "message_sent") contacts += 1;
  }
  return {
    views,
    uniqueViews: viewUserIds.size,
    saves,
    shares,
    contacts,
    whatsappClicks: 0,
    websiteClicks: 0,
    appointmentClicks: 0,
  };
}

/** Shared vocabulary: preview shell, live `/clasificados/anuncio/[id]` (Autos), and dashboard. */
export const AUTOS_LISTING_ANALYTICS_PUBLIC_LABELS = {
  es: {
    kicker: "Rendimiento",
    views: "Vistas",
    saves: "Guardados",
    shares: "Compartidos",
    contacts: "Contactos",
    /** Live listing: real counts from la misma fuente que el panel. */
    liveFootnote: "Mismas métricas que en Mis anuncios (vistas, guardados, compartidos y contactos).",
  },
  en: {
    kicker: "Performance",
    views: "Views",
    saves: "Saves",
    shares: "Shares",
    contacts: "Contacts",
    liveFootnote: "Same metrics as My listings (views, saves, shares, and contacts).",
  },
} as const;
