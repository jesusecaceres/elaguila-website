/** Admin-only business-offer moderation row (operator-submitted Viajes lane). */

export type AdminViajesBusinessOfferStatus = "pending" | "approved" | "rejected" | "needs_edits";

export type AdminViajesBusinessOfferRow = {
  id: string;
  businessName: string;
  headline: string;
  destination: string;
  status: AdminViajesBusinessOfferStatus;
  submittedAt: string;
  validThrough: string | null;
  /** Short internal review stub */
  reviewNotes: string;
  /** Placeholder trust / risk tags */
  trustFlags: string[];
  /** Public business profile slug when known */
  businessProfileSlug: string | null;
  /** First-time travel advertiser on Leonix */
  firstTimeAdvertiser: boolean;
  /** Offer detail slug when live (sample) */
  publicOfferSlug: string | null;
  websiteProvided: boolean;
  whatsappProvided: boolean;
  imageModeration: "pending" | "ok" | "flagged";
};
