/**
 * LEONIX BUSINESS INFORMATION EDITOR / DISCOVER FIX (Gate 2) — the smallest separate
 * staff/public-prospect research lane, per source-trace finding: no such lane existed before
 * this, and the only existing engine (runBusinessAiResearch) requires BOTH source_research AND
 * ai_research client consent for everything it does, including its own non-AI Google Places and
 * website adapters. `ai_research` consent is real and deliberate (a distinct, labeled consent
 * type — "AI research"/"Investigación con IA" — never written by any UI today because the field
 * canvass form only collects 4 of the 5 types), and it is left completely untouched here.
 *
 * This lane:
 *  - reuses the EXISTING public-data adapters directly (runGooglePlacesResearchV1,
 *    runWebsiteResearchV1) — no new fetch/scrape code, no new provider;
 *  - NEVER calls the Gemini/AI provider — so it is not "AI processing of the business's data"
 *    and does not need ai_research consent;
 *  - requires NO client consent at all — there is no client relationship yet at the pre-visit
 *    prospect stage (business_consent_records is populated "at a visit", which by definition
 *    hasn't happened), gated only by the `run_public_research` staff capability;
 *  - returns CANDIDATE suggestions only, ephemeral (not persisted) — a human must explicitly
 *    accept a candidate (via the existing Business Information Editor write path,
 *    PATCH /api/admin/businesses/[businessId]/identity) before it ever touches canonical truth;
 *  - only surfaces fields the adapters actually, truthfully return — no fabricated social-link
 *    discovery (the website adapter has no social-link extraction today).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isGooglePlacesConfigured, runGooglePlacesResearchV1 } from "./googlePlacesAdapter";
import { runWebsiteResearchV1 } from "./websiteAdapter";
import { buildBusinessApplicationContext, type BusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";

export type ProspectResearchField = "businessName" | "phone" | "website" | "address" | "email" | "googleMapsUrl";

export type ProspectResearchCandidate = {
  field: ProspectResearchField;
  currentValue: string | null;
  researchedValue: string;
  source: "google_places" | "website_scan";
};

export type ProspectResearchResult =
  | { ok: true; businessId: string; current: BusinessApplicationContext; candidates: ProspectResearchCandidate[]; ranGooglePlaces: boolean; ranWebsiteScan: boolean }
  | { ok: false; error: "business_not_found" };

async function loadLocationHint(businessId: string): Promise<string | null> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("business_service_areas")
    .select("raw_text, city_hint, is_primary")
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { raw_text?: string; city_hint?: string | null } | null;
  return row?.city_hint?.trim() || row?.raw_text?.trim() || null;
}

function addCandidateIfDifferent(
  out: ProspectResearchCandidate[],
  field: ProspectResearchField,
  currentValue: string | null,
  researchedValue: string | null | undefined,
  source: ProspectResearchCandidate["source"],
) {
  const researched = researchedValue?.trim();
  if (!researched) return;
  const current = currentValue?.trim() || null;
  if (current && current.toLowerCase() === researched.toLowerCase()) return;
  out.push({ field, currentValue: current, researchedValue: researched, source });
}

/** Pure public-source lookup — no consent check, no AI/LLM call, no persistence. */
export async function runPublicProspectResearch(businessId: string): Promise<ProspectResearchResult> {
  const current = await buildBusinessApplicationContext(businessId);
  if (!current) return { ok: false, error: "business_not_found" };

  const locationHint = await loadLocationHint(businessId);
  const candidates: ProspectResearchCandidate[] = [];

  const ranGooglePlaces = isGooglePlacesConfigured();
  if (ranGooglePlaces) {
    const places = await runGooglePlacesResearchV1(current.businessName, locationHint);
    if (places.status === "completed") {
      addCandidateIfDifferent(candidates, "businessName", current.businessName, places.matchedName, "google_places");
      addCandidateIfDifferent(candidates, "address", current.address.street ?? current.address.city, places.formattedAddress, "google_places");
      addCandidateIfDifferent(candidates, "phone", current.phone, places.phone, "google_places");
      addCandidateIfDifferent(candidates, "website", current.website, places.websiteUri, "google_places");
      addCandidateIfDifferent(candidates, "googleMapsUrl", current.googleBusinessUrl, places.mapsUri, "google_places");
    }
  }

  const websiteToScan = current.website;
  const ranWebsiteScan = Boolean(websiteToScan);
  if (websiteToScan) {
    const site = await runWebsiteResearchV1(websiteToScan);
    if (site.status === "completed") {
      addCandidateIfDifferent(candidates, "phone", current.phone, site.contacts.phones[0], "website_scan");
      addCandidateIfDifferent(candidates, "email", current.email, site.contacts.emails[0], "website_scan");
    }
  }

  return { ok: true, businessId, current, candidates, ranGooglePlaces, ranWebsiteScan };
}
