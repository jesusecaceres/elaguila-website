import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const partner = read("app/lib/ofertas-locales/ofertasLocalesPartnerOperations.ts");
const search = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const offers = read("app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const client = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");

assert.match(partner, /compareOfertaLocalDefaultRanking/);
assert.match(partner, /ofertaLocalPartnerRankingWeight/);
assert.match(partner, /1000 \+ \(vm\.highlightedPlacement \? 500 : 0\)/);
assert.match(partner, /return a\.id\.localeCompare\(b\.id\)/);

assert.match(search, /sort === "price_low"/);
assert.match(search, /return ap - bp/);
assert.match(search, /sort === "newest"/);
assert.match(search, /compareOfertaLocalDefaultRanking/);
assert.match(search, /sortRaw = params\.get\("sort"\)\?\.trim\(\) \?\? "relevance"/);

assert.match(offers, /sortRaw = params\.get\("sort"\)\?\.trim\(\) \?\? "relevance"/);
assert.match(offers, /sort === "expiring_soon"/);
assert.match(offers, /sort === "newest"/);
assert.match(offers, /compareOfertaLocalDefaultRanking/);

assert.match(client, /value: "relevance"/);
assert.match(client, /value: "price_low"/);
assert.doesNotMatch(search, /Math\.random|randomUUID/);
assert.doesNotMatch(offers, /Math\.random|randomUUID/);

console.log("PASS ofertas-partner-ranking-audit");
