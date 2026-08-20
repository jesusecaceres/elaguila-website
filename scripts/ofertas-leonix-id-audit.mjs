import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const migration = read("supabase/migrations/20260731235500_ofertas_locales_commercial_activation_identity.sql");
const helper = read("app/lib/ofertas-locales/ofertasLocalesLeonixAdId.ts");
const schema = read("app/lib/ofertas-locales/ofertasLocalesDbSchema.ts");
const stripe = read("app/lib/listingPlans/revenueStripe.ts");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const owner = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const admin = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");
const publicDetail = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");

assert.match(migration, /add column if not exists leonix_ad_id text/);
assert.match(migration, /ofertas_locales_leonix_ad_id_format_chk/);
assert.match(migration, /\^LNX-\[A-Z0-9\]\{8\}\$/);
assert.match(migration, /create unique index if not exists ofertas_locales_leonix_ad_id_unique_idx/);
assert.doesNotMatch(migration, /\bupdate\b[\s\S]*leonix_ad_id/i);

assert.match(helper, /randomBytes\(4\)/);
assert.match(helper, /LNX-\$\{randomBytes\(4\)\.toString\("hex"\)\.toUpperCase\(\)\}/);
assert.match(helper, /ensureOfertaLocalLeonixAdId/);
assert.match(helper, /\.is\("leonix_ad_id", null\)/);
assert.doesNotMatch(helper, /business_name|title|phone|email|zip_code|customer/i);

assert.match(schema, /leonix_ad_id/);
assert.match(stripe, /leonixAdId/);
assert.match(checkoutRoute, /serverVerifiedLeonixAdId/);
assert.match(owner, /ID Leonix|leonixAdId/);
assert.match(admin, /ID Leonix|leonixAdId/);
assert.match(publicDetail, /ID Leonix/);

console.log("PASS ofertas-leonix-id-audit");
