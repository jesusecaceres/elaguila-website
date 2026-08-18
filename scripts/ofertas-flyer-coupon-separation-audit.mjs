import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const publish = read("app/api/ofertas-locales/publish/route.ts");
const reviewPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const searchClient = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const shoppingHook = read("app/(site)/clasificados/ofertas-locales/useOfertasLocalesShoppingList.ts");
const publicItemCard = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx");

assert.match(publish, /parentMatchesDraftLane/);
assert.match(publish, /ai_review_parent_mismatch/);
assert.match(reviewPanel, /reviewMode\?: "weekly" \| "coupon"/);
assert.match(reviewPanel, /isCouponMode/);
assert.match(reviewPanel, /couponTitle/);
assert.match(reviewPanel, /offerText/);
assert.match(searchClient, /!isCupones && selectedItem/);
assert.match(searchClient, /!isCupones && listOpen/);
assert.match(searchClient, /floatingShoppingListCart = !isCupones/);
assert.match(searchClient, /offerType/);
assert.match(shoppingHook, /localStorage/);
assert.doesNotMatch(publicItemCard, /checkout|cart|quantity purchasing|redemption/i);

console.log("PASS ofertas-flyer-coupon-separation-audit");
