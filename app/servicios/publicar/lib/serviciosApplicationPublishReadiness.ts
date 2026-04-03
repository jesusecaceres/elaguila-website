import { buildHeroCategoryLineFromDraft } from "../../lib/mapServiciosApplicationDraftToBusinessProfile";
import type { ServiciosApplicationDraft } from "../../types/serviciosApplicationDraft";

function trim(s: string | undefined | null): string {
  return typeof s === "string" ? s.trim() : "";
}

/**
 * Minimum bar before a future “publish” action (draft can still be previewed anytime).
 */
export function getServiciosPublishReadiness(draft: ServiciosApplicationDraft): {
  ready: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!trim(draft.identity?.businessName)) missing.push("businessName");
  if (!trim(draft.identity?.slug)) missing.push("slug");

  const categoryLine = buildHeroCategoryLineFromDraft(draft.hero);
  if (!categoryLine) missing.push("category");

  const phone = trim(draft.contact?.phone);
  const website = trim(draft.contact?.websiteUrl);
  if (!phone && !website) missing.push("contact");

  if (!trim(draft.about?.aboutText)) missing.push("about");

  const services = draft.services ?? [];
  const hasCompleteService = services.some((s) => trim(s.title) && trim(s.imageUrl));
  if (!hasCompleteService) missing.push("services");

  return {
    ready: missing.length === 0,
    missing,
  };
}
