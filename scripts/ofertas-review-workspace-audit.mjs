import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const panel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const mapper = read("app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts");
const itemRoute = read("app/api/ofertas-locales/items/[itemId]/route.ts");
const itemsRoute = read("app/api/ofertas-locales/items/route.ts");
const publish = read("app/api/ofertas-locales/publish/route.ts");

assert.match(panel, /reviewStatusLabel/);
assert.match(panel, /selectedPageFilter/);
assert.match(panel, /statusFilter/);
assert.match(panel, /handleApproveAndNext/);
assert.match(panel, /handleConfirmReject/);
assert.match(panel, /handleStatusAndAdvance\(itemId, "rejected"\)/);
assert.match(panel, /priceAmountCents/);
assert.match(panel, /aria-live="polite"/);
assert.match(mapper, /validateOfertaLocalItemReviewPatch/);
assert.match(mapper, /invalid_price_amount_cents/);
assert.match(itemRoute, /resolveOfertasLocalesOwnerOrAdminAuth/);
assert.match(itemRoute, /\.eq\("owner_id", auth\.actorUserId\)/);
assert.match(itemsRoute, /assertOfferAccess/);
assert.match(publish, /ai_review_incomplete/);
assert.match(publish, /ai_review_approved_source_item_required/);

console.log("PASS ofertas-review-workspace-audit");
