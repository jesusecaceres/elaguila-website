/**
 * Business Concierge — Google Business Profile / Maps V1 research adapter. Server-only. Real
 * public data from Google's own Places API (New) — never invented, never a fabricated rating or
 * review count. Mirrors the exact bounded/truthful conventions of websiteAdapter.ts: a single
 * timed request, no retries, no scraping, honest failure states, every field marked
 * requiresConfirmation before it can become canonical Living Book truth. Gated on
 * GOOGLE_PLACES_API_KEY exactly like Gemini is gated on GEMINI_API_KEY (providerRegistry.ts /
 * geminiProvider.ts) — absence is a truthful "not configured" state, never silently retried or
 * faked. Uses the real @google/generative-ai-adjacent Places REST endpoint directly (a single
 * fetch call) rather than the full googleapis SDK, keeping this narrowly scoped like the website
 * adapter rather than pulling in an OAuth-oriented client library for one API-key request.
 */
import "server-only";

import type { GooglePlacesResearchResult } from "./types";

const GOOGLE_PLACES_ENV_KEY = "GOOGLE_PLACES_API_KEY" as const;
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FETCH_TIMEOUT_MS = 8_000;
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
  "places.types",
].join(",");

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env[GOOGLE_PLACES_ENV_KEY]?.trim());
}

function getGooglePlacesApiKey(): string | null {
  const key = process.env[GOOGLE_PLACES_ENV_KEY]?.trim();
  return key || null;
}

function emptyResult(observedAt: string, status: GooglePlacesResearchResult["status"], limitations: string[]): GooglePlacesResearchResult {
  return {
    status,
    observedAt,
    matchedName: null,
    formattedAddress: null,
    phone: null,
    websiteUri: null,
    mapsUri: null,
    rating: null,
    userRatingCount: null,
    businessStatus: null,
    types: [],
    evidence: [],
    limitations,
  };
}

type PlacesTextSearchPlace = {
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
};

/**
 * Truthful, bounded Google Business Profile lookup by name (+ optional location hint). Never
 * claims a Places API certification, never assumes the top text-search result is definitely the
 * correct business — every field is explicitly marked requiresConfirmation so staff verify the
 * match before treating it as canonical. Real rating/review-count are Google's own published
 * figures at retrieval time, not a Leonix claim or endorsement.
 */
export async function runGooglePlacesResearchV1(businessName: string, locationHint: string | null): Promise<GooglePlacesResearchResult> {
  const observedAt = new Date().toISOString();
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return emptyResult(observedAt, "not_configured", ["GOOGLE_PLACES_API_KEY is not configured on the server."]);
  }

  const textQuery = locationHint ? `${businessName} ${locationHint}` : businessName;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(SEARCH_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery, maxResultCount: 1 }),
    });
  } catch {
    clearTimeout(timer);
    return emptyResult(observedAt, "unreachable", ["Could not reach the Google Places API."]);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    return emptyResult(observedAt, "unauthorized", [`Google Places API rejected the request (HTTP ${res.status}) — check the configured API key/restrictions.`]);
  }
  if (!res.ok) {
    return emptyResult(observedAt, "unreachable", [`Google Places API returned HTTP ${res.status}.`]);
  }

  let body: { places?: PlacesTextSearchPlace[] };
  try {
    body = (await res.json()) as { places?: PlacesTextSearchPlace[] };
  } catch {
    return emptyResult(observedAt, "unreachable", ["Google Places API returned an unparseable response."]);
  }

  const place = Array.isArray(body.places) ? body.places[0] : undefined;
  if (!place) {
    return emptyResult(observedAt, "not_found", ["No matching Google Business Profile was found for this business name/location."]);
  }

  const matchedName = typeof place.displayName?.text === "string" ? place.displayName.text : null;
  const formattedAddress = typeof place.formattedAddress === "string" ? place.formattedAddress : null;
  const phone = typeof place.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : (typeof place.internationalPhoneNumber === "string" ? place.internationalPhoneNumber : null);
  const websiteUri = typeof place.websiteUri === "string" ? place.websiteUri : null;
  const mapsUri = typeof place.googleMapsUri === "string" ? place.googleMapsUri : null;
  const rating = typeof place.rating === "number" ? place.rating : null;
  const userRatingCount = typeof place.userRatingCount === "number" ? place.userRatingCount : null;
  const businessStatus = typeof place.businessStatus === "string" ? place.businessStatus : null;
  const types = Array.isArray(place.types) ? place.types.filter((t): t is string => typeof t === "string").slice(0, 10) : [];

  const evidence: GooglePlacesResearchResult["evidence"] = [];
  if (matchedName) evidence.push({ category: "verified_name", claim: matchedName, confidence: "high", requiresConfirmation: true });
  if (formattedAddress) evidence.push({ category: "verified_address", claim: formattedAddress, confidence: "high", requiresConfirmation: true });
  if (phone) evidence.push({ category: "verified_phone", claim: phone, confidence: "high", requiresConfirmation: true });
  if (websiteUri) evidence.push({ category: "verified_website", claim: websiteUri, confidence: "high", requiresConfirmation: true });
  if (rating !== null && userRatingCount !== null) {
    evidence.push({
      category: "google_rating",
      claim: `Google rating ${rating} from ${userRatingCount} review(s) — Google's own published figure at retrieval time, not a Leonix claim.`,
      confidence: "high",
      requiresConfirmation: false,
    });
  }
  if (businessStatus && businessStatus !== "OPERATIONAL") {
    evidence.push({ category: "business_status", claim: `Google reports this business status as: ${businessStatus}.`, confidence: "high", requiresConfirmation: true });
  }

  return {
    status: "completed",
    observedAt,
    matchedName,
    formattedAddress,
    phone,
    websiteUri,
    mapsUri,
    rating,
    userRatingCount,
    businessStatus,
    types,
    evidence,
    limitations: [
      "Text-search match only — staff must confirm this is the correct business location before treating any field as verified.",
      "Rating/review count are Google's own published figures at retrieval time, not a Leonix claim or endorsement, and are never promoted into the Living Business Book as a fact.",
    ],
  };
}
