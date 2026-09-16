/**
 * SERVICIOS FINAL GOLDEN UI + TRUST + OWNER ANALYTICS CLOSEOUT — focused proof (2026-09-15).
 *
 * Gate 2/3 — profile header surfaces real Leonix Community Trust (real vote counts + top-3 trait
 *   breakdown), never a fabricated numeric rating (none exists canonically; Google Reviews stays
 *   the separate, pre-existing star signal).
 * Gate 4/5 — results cards (both trade + professional templates) show a compact, read-only trust
 *   count sourced from a new bulk `leonix_endorsement_votes` count (mirrors the proven likes/saves
 *   bulk-fetch pattern; keyed strictly by `servicios_public_listings.id`, never an alias), and the
 *   CTA action area is tightened from 4 stacked rows to 2 without touching any button's handler,
 *   href, or analytics call.
 * Gate 6 — the full Community on Leonix section lower in the profile is untouched.
 * Gate 9/10/11 — no new analytics events invented, ES/EN copy present, no forced full-width mobile
 *   stack in the merged CTA row.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-trust-closeout.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const SERVER = "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts";
const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const CLIENT = "app/lib/leonixCommunityTrust/leonixEndorsementClient.ts";
const BRAND = "app/(site)/servicios/components/serviciosLeonixBrand.ts";

/* 1. Header uses the real, existing Community Trust fetch source — not a new/duplicate engine. */
check("profile header trust summary fetches via the shared fetchLeonixEndorsementSummary('servicios', ...) — same source as the full Community section", () => {
  const hero = raw(HERO);
  assert.ok(hero.includes('import {\n  fetchLeonixEndorsementSummary,'));
  assert.ok(hero.includes('fetchLeonixEndorsementSummary("servicios", targetId)'));
});

/* 2. Header never fabricates a numeric rating. */
check("header trust summary never invents a numeric score — only real vote counts + trait labels are rendered", () => {
  const hero = raw(HERO);
  const fnStart = hero.indexOf("function ServiciosHeroTrustSummary(");
  const fnEnd = hero.indexOf("\nexport function ServiciosProfessionalHero(");
  const body = hero.slice(fnStart, fnEnd);
  assert.ok(!/[1-5]\.\d\s*(\/\s*5|out of 5|de 5|estrellas|stars)/i.test(body), "no synthetic N.N/5 style score constructed here");
  assert.ok(body.includes("const total = summary.reduce((sum, e) => sum + e.count, 0);"), "total is a real sum of real vote counts");
  assert.ok(!body.includes("rating"), "this block never touches the separate Google Reviews rating field");
});

/* 3. Zero-count state is truthful, not a fake positive signal. */
check("header shows a truthful 'New on Leonix' state at zero votes, never a fabricated count/rating", () => {
  const hero = raw(HERO);
  assert.ok(hero.includes('lang === "en" ? "New on Leonix" : "Nuevo en Leonix"'));
});

/* 4. Results-card trust count is sourced from the same underlying vote table via a real bulk query — not invented client-side. */
check("bulk endorsement counter queries the real leonix_endorsement_votes table, keyed by target_type=servicios_profile, chunked like the proven likes/saves helpers", () => {
  const server = raw(SERVER);
  assert.ok(server.includes("export async function fetchServiciosEndorsementCountsByListingIds(ids: string[]): Promise<Map<string, number>> {"));
  assert.ok(server.includes('.from("leonix_endorsement_votes")'));
  assert.ok(server.includes('.eq("target_type", "servicios_profile")'));
  assert.ok(server.includes('.in("target_id", chunk)'));
  assert.ok(server.includes("const chunkSize = 120;"), "same chunking discipline as the existing like/save bulk helpers");
});
check("public_endorsement_count is wired into listServiciosPublicListingsRaw's existing Promise.all batch (one query per results page load, not per card)", () => {
  const server = raw(SERVER);
  assert.ok(server.includes("fetchServiciosEndorsementCountsByListingIds(endorsementIds)"));
  const allIdx = server.indexOf("const [agg, likeMap, saveMap, endorsementMap] = await Promise.all([");
  assert.ok(allIdx > 0, "endorsement bulk fetch runs in parallel with the existing likes/saves/review-aggregate fetches");
  assert.ok(server.includes("public_endorsement_count?: number;"));
});
check("endorsement count is keyed strictly by row.id — never the multi-alias like/save key pattern (identity doctrine)", () => {
  const server = raw(SERVER);
  assert.ok(server.includes('const endorsementIds = slice.map((r) => (r.id ?? "").trim()).filter(Boolean);'));
  assert.ok(!/fetchServiciosEndorsementCountsByListingIds\(\s*\[\.\.\.likeQueryKeys\]/.test(server), "never reuses the like/save alias-key set for endorsements");
});

/* 5. Results cards render the count read-only — no voting control on a results card. */
check("neither result card mounts a vote/toggle control — trust count is read-only display only", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(!src.includes("toggleLeonixEndorsementVoteClient"), `${rel}: no voting wired into a results card`);
    assert.ok(!src.includes("<LeonixCommunityTrust"), `${rel}: does not embed the full interactive trust component`);
  }
});
check("both result cards render the endorsement count as plain text driven by row.public_endorsement_count", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("row.public_endorsement_count") || src.includes("row?.public_endorsement_count"));
    // Servicios Final UI Truth Closeout (2026-09-16, Gate 5): owner decision changed — the branded
    // Comunidad Leonix chip now stays visible even at zero ("Nuevo"), rather than being hidden.
    // `endorsementCount > 0` still branches the TEXT (real count vs. "Nuevo"), never the visibility.
    assert.ok(src.includes("endorsementCount > 0"), `${rel}: real-vs-zero text branch still present`);
  }
});

/* 6. Full Community on Leonix section is untouched. */
check("ServiciosBusinessHubContactCard's full LeonixCommunityTrust section mount is unchanged", () => {
  const card = raw(HUB_CARD);
  assert.ok(card.includes("<LeonixCommunityTrust"));
  assert.ok(card.includes('category="servicios"'));
  assert.ok(card.includes('targetId={(listingSourceId ?? "").trim()}'));
  assert.ok(card.includes("preview={!(listingSourceId ?? \"\").trim()}"));
});

/* 7. CTA handlers/analytics survive the density redesign — same tracked event types, same hrefs. */
check("trade card CTA density redesign keeps the exact same tracked CTA event types (call/whatsapp/maps/website/email)", () => {
  const card = raw(TRADE_CARD);
  for (const ev of ['"cta_call_click"', '"cta_whatsapp_click"', '"cta_maps_click"', '"cta_website_click"', '"cta_email_click"']) {
    assert.ok(card.includes(ev), `missing tracked event ${ev}`);
  }
  assert.ok(card.includes("trackServiciosResultCardClick(row)"), "whole-card / Ver perfil click tracking intact");
});
check("professional card CTA density redesign (non-compact branch) keeps the exact same onClick handlers and compact branch is untouched", () => {
  const card = raw(PRO_CARD);
  assert.ok(card.includes("onClick={onCallClick}") && card.includes("onClick={onWhatsAppClick}") && card.includes("onClick={onDirectionsClick}"));
  assert.ok(card.includes('sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]'), "isCompact sidebar-rail branch classes unchanged");
});

/* 8. No new analytics event types invented for the new trust UI. */
check("no new analytics event/tracking call was introduced for the header or card trust displays themselves", () => {
  const hero = raw(HERO);
  const heroTrustBlock = hero.slice(hero.indexOf("function ServiciosHeroTrustSummary("), hero.indexOf("\nexport function ServiciosProfessionalHero("));
  assert.ok(!heroTrustBlock.includes("trackServicios"), "trust summary block never calls any tracking function");
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(!src.includes("endorsement_view") && !src.includes("trust_summary_click"), `${rel}: no invented endorsement-specific event`);
  }
});

/* 9. No duplicate trust engine — the in-flight fetch dedup guards the one real source, no second table/RPC. */
check("shared client caches in-flight requests by (category,targetId) — prevents a duplicate fetch when header + full section both mount on the same page load", () => {
  const client = raw(CLIENT);
  assert.ok(client.includes("const inFlightSummaryRequests = new Map<string, Promise<LeonixEndorsementSummaryResult>>();"));
  assert.ok(client.includes("inFlightSummaryRequests.delete(key);"), "cleared after settling — a later real request (e.g. post-vote) is never served stale data");
});
check("no second endorsement/vote table or RPC was introduced — the bulk counter reads the exact same leonix_endorsement_votes table the single-target RPC already reads", () => {
  const server = raw(SERVER);
  assert.ok(!/create table|leonix_endorsement_votes_v2|leonix_trust_/i.test(server), "no new trust table referenced");
});

/* 10. ES/EN copy present for every new string. */
check("all new trust copy (header + both cards) is ES/EN-aware, no hardcoded single-language string", () => {
  for (const rel of [HERO, TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/lang === "en"\s*\?\s*`?\$\{?(total|endorsementCount)/.test(src) || src.includes('lang === "en" ? "New on Leonix"'), `${rel}: trust copy branches on lang`);
  }
});

/* 11. Mobile action layout: merged CTA row uses flex-wrap, not a forced full-width flex-col stack. */
check("results-card merged primary CTA row (call+whatsapp+directions) uses flex-wrap (not flex-col) so buttons share rows on wide-enough viewports", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('<div className="flex flex-wrap gap-2">'), `${rel}: merged CTA row present`);
  }
});
check("new LX_CTA_CARD_PRIMARY_FLEX brand token is additive — existing LX_CTA_CARD_PRIMARY (used elsewhere) is untouched", () => {
  const brand = raw(BRAND);
  assert.ok(brand.includes("export const LX_CTA_CARD_PRIMARY = `${LX_CTA_PRIMARY} min-h-[36px] w-full rounded-lg"));
  assert.ok(brand.includes("export const LX_CTA_CARD_PRIMARY_FLEX = `${LX_CTA_PRIMARY} min-h-[36px] flex-1 min-w-[7rem] rounded-lg"));
});

/* 12. Canonical listing identity — endorsement target_id doctrine matches the toggle RPC's FK. */
check("endorsement bulk-count keys are the same servicios_public_listings.id the single-target toggle/summary RPCs already require", () => {
  const server = raw(SERVER);
  const fnStart = server.indexOf("export async function fetchServiciosEndorsementCountsByListingIds");
  const fnEnd = server.indexOf("\n}\n", fnStart);
  const body = server.slice(fnStart, fnEnd);
  assert.ok(!body.includes("leonix_ad_id") && !body.includes("slug"), "never keyed by ad id or slug — id only");
});

/* 13. Owner dashboard wiring unchanged (Gate 7 — confirmed correct, no repair needed). */
check("owner dashboard Community Trust fetch wiring is untouched by this pass", () => {
  const dash = raw("app/(site)/dashboard/servicios/page.tsx");
  assert.ok(dash.includes("/api/leonix-endorsements?category=servicios&targetId="), "same endpoint/category contract as before");
});

/* 14. Existing Translate-Ad shared fix (prior task) remains untouched by this pass. */
check("shared TranslateAdControl language-clarity labels are untouched by this Golden Trust pass", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(src.includes('translateAd: "Translate to English",'));
  assert.ok(src.includes('translateAd: "Traducir al español",'));
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-trust-closeout: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-trust-closeout: PASS");
