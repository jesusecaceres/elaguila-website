/**
 * Globalization Build D-S2, Gate DS2-1 — Comida Local Google/Yelp review-link builder, extracted
 * to its own small pure-function module (no transitive imports beyond the shared URL validator)
 * so it stays independently testable without pulling in the rest of the preview-mapping file's
 * larger dependency graph.
 *
 * Real Google/Yelp review-page URLs only. Missing/invalid provider URL hides that provider; both
 * missing yields an empty array — the shared SharedConnectionHubReviewDrawer itself renders
 * nothing when given an empty links array (see ComidaLocalDetailShell.tsx).
 */
import { isValidAdditionalWebsiteUrl } from "../../additionalWebsites/additionalWebsiteEntry";
import type { SharedConnectionHubReviewLink } from "../../../components/contact/connectionHub/sharedConnectionHubContactTypes";
import type { ComidaLocalDraft } from "./comidaLocalTypes";

export function buildComidaLocalReviewLinks(
  draft: Pick<ComidaLocalDraft, "googleReviewsUrl" | "yelpReviewsUrl">,
  lang: "es" | "en",
): SharedConnectionHubReviewLink[] {
  const links: SharedConnectionHubReviewLink[] = [];
  const google = draft.googleReviewsUrl.trim();
  if (isValidAdditionalWebsiteUrl(google)) {
    links.push({ provider: "google", label: lang === "en" ? "Google Reviews" : "Reseñas de Google", url: google });
  }
  const yelp = draft.yelpReviewsUrl.trim();
  if (isValidAdditionalWebsiteUrl(yelp)) {
    links.push({ provider: "yelp", label: "Yelp", url: yelp });
  }
  return links;
}
