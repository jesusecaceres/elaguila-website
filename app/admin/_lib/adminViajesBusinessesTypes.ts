/** Admin-only travel business / agency profile row. */

export type AdminViajesBusinessPlan = "standard" | "plus";

export type AdminViajesBusinessStatus = "active" | "paused" | "pending_review";

export type AdminViajesBusinessRow = {
  id: string;
  businessName: string;
  profileStatus: AdminViajesBusinessStatus;
  destinationsServed: string[];
  languages: string[];
  contactSummary: string;
  offersCount: number;
  trustPlaceholder: string;
  plan: AdminViajesBusinessPlan;
  publicProfileSlug: string | null;
};
