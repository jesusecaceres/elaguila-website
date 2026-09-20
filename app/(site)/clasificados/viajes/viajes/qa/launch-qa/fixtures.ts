/**
 * Viajes launch-QA fixture catalog — editorial/QA only.
 * Never impersonates real providers, ratings, verification, discounts, or availability.
 */

export type ViajesLaunchQaFixtureKind =
  | "full_business"
  | "minimal_business"
  | "private"
  | "affiliate"
  | "normalized_v1"
  | "v2"
  | "no_price"
  | "free"
  | "long_title"
  | "long_description"
  | "multi_module"
  | "media_rich"
  | "no_optional_modules"
  | "no_results_query"
  | "sort_mix";

export type ViajesLaunchQaFixture = {
  id: string;
  kind: ViajesLaunchQaFixtureKind;
  label: string;
  /** Public browse/query helper when applicable */
  browseQuery?: string;
  /** Sample offer slug when using curated demo catalog */
  sampleSlug?: string;
  notes: string;
  forbiddenClaims: string[];
};

export const VIAJES_LAUNCH_QA_FIXTURES: ViajesLaunchQaFixture[] = [
  {
    id: "qa-full-business",
    kind: "full_business",
    label: "Full business offer (V2 modules + media)",
    sampleSlug: "tour-napa-test",
    notes: "Use staged/demo business detail with modules populated.",
    forbiddenClaims: ["rating", "review", "verified", "discount", "availability", "scarcity"],
  },
  {
    id: "qa-minimal-business",
    kind: "minimal_business",
    label: "Minimal business offer",
    notes: "Title + destination + durable hero only; empty optional modules hidden.",
    forbiddenClaims: ["rating", "review", "verified", "discount", "availability"],
  },
  {
    id: "qa-private",
    kind: "private",
    label: "Private offer (Inquiry Hub)",
    notes: "privateExact must remain non-public.",
    forbiddenClaims: ["business hub", "verified", "rating"],
  },
  {
    id: "qa-affiliate",
    kind: "affiliate",
    label: "Affiliate / outbound offer",
    notes: "Outbound disclosure required; partner inventory label only when affiliate.",
    forbiddenClaims: ["fake partnership", "rating", "discount"],
  },
  {
    id: "qa-v1-normalized",
    kind: "normalized_v1",
    label: "Normalized V1 envelope",
    notes: "V1 negocios/privado draft normalizes through normalizeViajesOfferToV2.",
    forbiddenClaims: ["dual writer"],
  },
  {
    id: "qa-v2",
    kind: "v2",
    label: "Canonical V2 staged envelope",
    notes: "{ version: 2, offer } serialization path.",
    forbiddenClaims: ["blob:", "data:"],
  },
  {
    id: "qa-no-price",
    kind: "no_price",
    label: "Offer without price",
    notes: "Price UI must hide rather than invent $0.",
    forbiddenClaims: ["$0", "NaN"],
  },
  {
    id: "qa-free",
    kind: "free",
    label: "Explicitly free offer",
    notes: "Only show Gratis/Free when language is explicit.",
    forbiddenClaims: ["fake free", "discount"],
  },
  {
    id: "qa-long-title",
    kind: "long_title",
    label: "Long title stress",
    notes: "Cards and detail must clamp without overflow.",
    forbiddenClaims: [],
  },
  {
    id: "qa-long-description",
    kind: "long_description",
    label: "Long description stress",
    notes: "Detail story must wrap; no horizontal overflow.",
    forbiddenClaims: [],
  },
  {
    id: "qa-multi-module",
    kind: "multi_module",
    label: "Multi-module offer",
    notes: "Accommodation + transport + food + activity visible when filled.",
    forbiddenClaims: ["empty module shell"],
  },
  {
    id: "qa-media-rich",
    kind: "media_rich",
    label: "Media-rich gallery",
    notes: "Hero + results-card roles + gallery order + focal.",
    forbiddenClaims: ["blob:", "data:"],
  },
  {
    id: "qa-no-optional",
    kind: "no_optional_modules",
    label: "No optional modules",
    notes: "Empty modules must not render shells.",
    forbiddenClaims: ["empty module shell"],
  },
  {
    id: "qa-no-results",
    kind: "no_results_query",
    label: "No-results search",
    browseQuery: "q=zzznomatchleonixviajes999&dest=&from=&t=",
    notes: "Empty state + reset filters must appear.",
    forbiddenClaims: ["fake results"],
  },
  {
    id: "qa-sort-mix",
    kind: "sort_mix",
    label: "Mixed-result sorting set",
    browseQuery: "sort=priceAsc",
    notes: "Supported sorts: featured, newest, priceAsc, priceDesc only.",
    forbiddenClaims: ["popularity", "best rated", "most booked", "biggest savings"],
  },
];

export const VIAJES_LAUNCH_QA_FORBIDDEN_SORTS = [
  "popularity",
  "bestRated",
  "mostBooked",
  "biggestSavings",
  "availability",
  "verifiedFirst",
  "sponsoredFirst",
] as const;

export const VIAJES_LAUNCH_QA_SUPPORTED_SORTS = ["featured", "newest", "priceAsc", "priceDesc"] as const;
