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
