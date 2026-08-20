import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const endpoint = read("app/api/analytics/events/route.ts");
const eventTypes = read("app/lib/listingAnalyticsEventTypes.ts");
const identity = read("app/lib/analytics/listingAnalyticsIdentity.ts");
const resolver = read("app/lib/analytics/server/resolveListingAnalyticsIdentity.ts");
const validator = read("app/lib/analytics/server/validateAnalyticsEvent.ts");
const ofertasAnalytics = read("app/lib/ofertas-locales/ofertasLocalesPublicAnalytics.ts");
const detail = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
const searchClient = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const migration = read("supabase/migrations/20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql");

assert.match(endpoint, /POST \/api\/analytics\/events/);
assert.match(endpoint, /\.from\("listing_analytics"\)/);
assert.doesNotMatch(migration, /create table if not exists public\.ofertas.*analytics/i);
assert.match(identity, /"ofertas_locales"/);
assert.match(identity, /"ofertas-locales"/);
assert.match(resolver, /resolveOfertasLocalesRow/);
assert.match(resolver, /sourceTable: "ofertas_locales"/);

for (const eventName of [
  "listing_impression",
  "listing_open",
  "flyer_page_view",
  "product_impression",
  "product_open",
  "product_search",
  "product_search_result_click",
  "shopping_list_add",
  "shopping_list_remove",
  "listing_share",
  "website_click",
  "phone_click",
  "message_click",
  "whatsapp_click",
  "email_click",
  "directions_click",
  "coupon_open",
]) {
  assert.match(eventTypes, new RegExp(`"${eventName}"`), `${eventName} missing from TS event allowlist`);
  assert.match(validator, new RegExp(`"${eventName}"`), `${eventName} missing from anonymous-safe validator`);
  assert.match(migration, new RegExp(`'${eventName}'`), `${eventName} missing from DB check migration`);
}

assert.match(ofertasAnalytics, /recordAnalyticsEvent/);
assert.match(ofertasAnalytics, /leonixAnalyticsAllowed/);
assert.match(ofertasAnalytics, /if \(!canTrackAnalytics\(\)\) return/);
assert.match(ofertasAnalytics, /source_table: SOURCE_TABLE/);
assert.match(ofertasAnalytics, /key\.toLowerCase\(\)\.includes\("stripe"\)/);
assert.match(ofertasAnalytics, /key\.toLowerCase\(\)\.includes\("payment"\)/);
assert.match(detail, /trackOfertaLocalListingOpen/);
assert.match(detail, /flyer_page_view/);
assert.match(detail, /shopping_list_add/);
assert.match(searchClient, /product_search/);
assert.match(searchClient, /product_search_result_click/);
assert.match(searchClient, /coupon_open/);

console.log("PASS ofertas-canonical-analytics-audit");
