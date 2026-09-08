import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql");
const prices = read("app/lib/ofertas-locales/ofertasLocalesPriceNormalization.ts");
const mapper = read("app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts");
const reviewMapper = read("app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts");
const panel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");

assert.match(migration, /price_amount_cents integer/i);
assert.match(migration, /original_price_text text/i);
assert.match(migration, /price_parse_status text not null default 'unknown'/i);
assert.match(prices, /Math\.round\(numeric \* 100\)/);
assert.match(prices, /DEAL_TEXT_RE/);
assert.match(prices, /1,3}\(\?:,\\d\{3\}\)\+/);
for (const sample of ["8.99", "$8.99", "2 for $5", "3/$10", ".99", "10.00", "1,299.99"]) {
  assert.match(prices, new RegExp(sample.replace(/[.$]/g, "\\$&").replace("/", "\\/")));
}
assert.match(mapper, /normalizeOfertaLocalPrice/);
assert.match(reviewMapper, /price_amount_cents/);
assert.match(reviewMapper, /price_parse_status/);
assert.match(panel, /priceAmountCents/);
assert.doesNotMatch(panel, /priceAmount:\s*draft\.priceAmount\.trim\(\)\s*\?\s*Number\(draft\.priceAmount\)/);

console.log("PASS ofertas-decimal-price-audit");
