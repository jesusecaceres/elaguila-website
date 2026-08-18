/**
 * Package D Build D2, Gate 11 — narrow verifier for the new global-core contracts: placement
 * eligibility rules, ranking group order, shared Connection Hub foundation, and the unified CTA
 * analytics dispatch contract. No DB/network — pure-function proofs only (live DB reads/writes are
 * exercised structurally via TypeScript, not re-certified live here; that live-certification
 * pattern is reserved for a dedicated gate, as established in Package C's C9).
 * Run: npx tsx scripts/verify-package-d-d2-global-core-unification.ts
 */
import {
  isPlacementEntitlementActive,
  isSurfaceEligible,
  placementCategoryMatches,
  placementTierRank,
} from "../app/lib/listingPlans/placementEntitlements";
import {
  PLACEMENT_GROUP_ORDER,
  comparePlacementAwareDefaultOrder,
  placementSignalToDefaultRankWeight,
} from "../app/lib/listingPlans/placementRankingAdapter";
import {
  buildSharedConnectionHubContact,
  isSafeExternalHref,
} from "../app/components/contact/connectionHub/sharedConnectionHubContactModel";
import { sharedConnectionHubHasVisibleContent } from "../app/components/contact/connectionHub/sharedConnectionHubContactTypes";

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const NOW = new Date("2026-08-11T12:00:00.000Z");

/* ============================= PLACEMENT ============================= */

check(
  isPlacementEntitlementActive({ status: "active", startsAt: null, endsAt: null }, NOW),
  "PLACEMENT: active entitlement with no date bounds resolves active",
);
check(
  !isPlacementEntitlementActive({ status: "expired", startsAt: null, endsAt: null }, NOW),
  "PLACEMENT: expired entitlement never resolves active",
);
check(
  !isPlacementEntitlementActive({ status: "cancelled", startsAt: null, endsAt: null }, NOW),
  "PLACEMENT: cancelled entitlement never resolves active",
);
check(
  !isPlacementEntitlementActive({ status: "scheduled", startsAt: "2099-01-01T00:00:00.000Z", endsAt: null }, NOW),
  "PLACEMENT: scheduled entitlement with a future start does not resolve active yet",
);
check(
  isPlacementEntitlementActive({ status: "scheduled", startsAt: "2020-01-01T00:00:00.000Z", endsAt: null }, NOW),
  "PLACEMENT: scheduled entitlement whose start has already passed resolves active",
);
check(
  isPlacementEntitlementActive({ status: "comped", startsAt: null, endsAt: "2099-01-01T00:00:00.000Z" }, NOW),
  "PLACEMENT: comped entitlement within its end date resolves active",
);
check(
  !isPlacementEntitlementActive({ status: "comped", startsAt: null, endsAt: "2020-01-01T00:00:00.000Z" }, NOW),
  "PLACEMENT: comped entitlement past its end date does not resolve active",
);
check(
  !placementCategoryMatches("servicios", "restaurantes"),
  "PLACEMENT: mismatched category never matches (a Servicios placement cannot benefit Restaurantes)",
);
check(
  placementCategoryMatches("bienes-raices", "bienes-raices"),
  "PLACEMENT: matching category matches",
);
check(
  !isSurfaceEligible({ surfaces: ["dashboard", "admin"] }, "category_results"),
  "PLACEMENT: entitlement not scoped to a surface is ineligible for that surface",
);
check(
  isSurfaceEligible({ surfaces: ["category_results"] }, "category_results"),
  "PLACEMENT: entitlement scoped to a surface is eligible for that surface",
);
check(
  placementTierRank("partner_premium") > placementTierRank("print_full_page") &&
    placementTierRank("print_full_page") > placementTierRank("print_half_page") &&
    placementTierRank("print_half_page") > placementTierRank("print_quarter_page") &&
    placementTierRank("print_quarter_page") > placementTierRank("website_business") &&
    placementTierRank("website_business") > placementTierRank("paid_private") &&
    placementTierRank("paid_private") > placementTierRank("affiliate") &&
    placementTierRank("affiliate") > placementTierRank("free"),
  "PLACEMENT: deterministic tier-rank ordering matches the locked default group order exactly",
);

/* ============================= RANKING ============================= */

check(
  JSON.stringify(PLACEMENT_GROUP_ORDER) ===
    JSON.stringify([
      "partner_premium",
      "print_full_page",
      "print_half_page",
      "print_quarter_page",
      "website_business",
      "paid_private",
      "affiliate",
      "free",
    ]),
  "RANKING: default placement tier ordering matches the locked 8-tier sequence",
);
check(
  placementSignalToDefaultRankWeight(null) === 0,
  "RANKING: no placement signal never fabricates a default-tier weight",
);
{
  const premium = placementSignalToDefaultRankWeight({
    entitlementId: "1",
    category: "servicios",
    tier: "partner_premium",
    source: "stripe_paid",
    surface: "category_results",
    status: "active",
    startsAt: null,
    endsAt: null,
    manualPriority: 100,
    rotationWeight: 1,
    rankWeight: placementTierRank("partner_premium"),
    listingId: "l1",
    leonixAdId: null,
  });
  const free = placementSignalToDefaultRankWeight({
    entitlementId: "2",
    category: "servicios",
    tier: "free",
    source: "free",
    surface: "category_results",
    status: "active",
    startsAt: null,
    endsAt: null,
    manualPriority: 100,
    rotationWeight: 1,
    rankWeight: placementTierRank("free"),
    listingId: "l2",
    leonixAdId: null,
  });
  check(premium > free, "RANKING: partner_premium outranks free in the default-order weight");
  const cmp = comparePlacementAwareDefaultOrder({ placementRankWeight: premium }, { placementRankWeight: free });
  check(cmp < 0, "RANKING: comparePlacementAwareDefaultOrder places the higher-weight item first");
}
// This adapter is never imported by any strict-sort comparator (proven by the BR-specific
// regression verifier — verify-package-d-d2-br-strict-price-sort.ts — asserting on the real,
// unrelated sort function directly). Documented here as a design boundary, not re-tested.

/* ============================= CONNECTION HUB ============================= */

{
  const empty = buildSharedConnectionHubContact({ lang: "es", mode: "full_hub" });
  check(!sharedConnectionHubHasVisibleContent(empty), "HUB: fully empty source data hides the whole card");
  check(empty.social.length === 0 && empty.reviews.length === 0 && empty.moreLinks.length === 0, "HUB: no data means no CTAs at all");
}
{
  const real = buildSharedConnectionHubContact({
    lang: "es",
    mode: "full_hub",
    phoneTelHref: "tel:+15551234567",
    websiteHref: "https://example.com",
    social: { facebook: "https://facebook.com/example", instagram: "" },
    googleReviewUrl: "https://google.com/maps/example",
    yelpReviewUrl: "https://yelp.com/biz/example",
  });
  check(Boolean(real.contact.phoneTelHref), "HUB: real phone href renders");
  check(Boolean(real.contact.websiteHref), "HUB: real safe website href renders");
  check(real.social.length === 1 && real.social[0]!.platform === "facebook", "HUB: only platforms with a real url are included");
  check(
    real.reviews.length === 2 &&
      real.reviews.some((r) => r.provider === "google") &&
      real.reviews.some((r) => r.provider === "yelp"),
    "HUB: Google and Yelp review links stay two distinct, separate entries — never combined",
  );
  check(
    real.reviews.every((r) => r.rating === undefined && r.reviewCount === undefined),
    "HUB: no rating/reviewCount is ever fabricated — none required, none invented",
  );
  check(sharedConnectionHubHasVisibleContent(real), "HUB: real data makes the card visible");
}
check(!isSafeExternalHref("javascript:alert(1)"), "HUB: a dangerous javascript: href is never treated as safe");
check(!isSafeExternalHref("not a url"), "HUB: a malformed href is never treated as safe");
check(isSafeExternalHref("https://example.com"), "HUB: a genuine https url is treated as safe");
{
  const dangerous = buildSharedConnectionHubContact({ lang: "es", mode: "full_hub", websiteHref: "javascript:alert(1)" });
  check(dangerous.contact.websiteHref === undefined, "HUB: an unsafe website href never renders a CTA");
}

/* ============================= ANALYTICS ============================= */

async function verifyAnalyticsDispatch() {
  const { dispatchConnectionHubCta } = await import("../app/lib/analytics/client/connectionHubCtaDispatch");
  const calls: any[] = [];
  const originalFetch = globalThis.fetch;
  // @ts-expect-error - test stub
  globalThis.fetch = async (_url: string, init: any) => {
    calls.push(JSON.parse(init.body));
    return { ok: true, json: async () => ({ ok: true }) } as any;
  };

  const base = { category: "ofertas-locales", sourceTable: "ofertas_locales", sourceId: "offer-1", surface: "public_detail" } as const;
  dispatchConnectionHubCta({ ...base, kind: "phone" });
  dispatchConnectionHubCta({ ...base, kind: "whatsapp" });
  dispatchConnectionHubCta({ ...base, kind: "email" });
  dispatchConnectionHubCta({ ...base, kind: "website" });
  dispatchConnectionHubCta({ ...base, kind: "directions" });
  dispatchConnectionHubCta({ ...base, kind: "share" });
  dispatchConnectionHubCta({ ...base, kind: "social", provider: "facebook" });
  dispatchConnectionHubCta({ ...base, kind: "review", provider: "google" });

  await new Promise((r) => setTimeout(r, 20));
  globalThis.fetch = originalFetch;

  const byKind = (kind: string) => calls.find((c) => c.metadata?.cta === kind);
  check(byKind("phone")?.event_type === "phone_click", "ANALYTICS: phone -> phone_click");
  check(byKind("whatsapp")?.event_type === "whatsapp_click", "ANALYTICS: whatsapp -> whatsapp_click");
  check(byKind("email")?.event_type === "email_click", "ANALYTICS: email -> email_click");
  check(byKind("website")?.event_type === "website_click", "ANALYTICS: website -> website_click");
  check(byKind("directions")?.event_type === "directions_click", "ANALYTICS: directions -> directions_click");
  check(byKind("share")?.event_type === "listing_share", "ANALYTICS: share -> listing_share");
  check(
    byKind("social")?.event_type === "cta_click" && byKind("social")?.metadata?.provider === "facebook",
    "ANALYTICS: social -> truthful cta_click with real provider metadata",
  );
  check(
    byKind("review")?.event_type === "cta_click" && byKind("review")?.metadata?.provider === "google",
    "ANALYTICS: review -> truthful cta_click with real provider metadata",
  );
  check(
    calls.every((c) => c.event_type !== "message_sent"),
    "ANALYTICS: no CTA click ever dispatches as message_sent",
  );
}

async function main() {
  await verifyAnalyticsDispatch();

  console.log(
    failures === 0
      ? "verify-package-d-d2-global-core-unification: all checks passed."
      : `verify-package-d-d2-global-core-unification: ${failures} FAILURE(S).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
