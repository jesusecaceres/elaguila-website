/**
 * Package 3 — Ofertas/Cupones lifecycle, owner/admin/public parity, and handoff audit.
 * Run: node scripts/ofertas-locales-package-3-public-owner-admin-audit.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const fromMarker = (source, marker) => {
  const idx = source.indexOf(marker);
  assert.notEqual(idx, -1, `Marker exists: ${marker}`);
  return source.slice(idx);
};

const files = {
  adminMutations: "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts",
  adminRoute: "app/api/ofertas-locales/admin/[id]/review/route.ts",
  adminActions: "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts",
  adminList: "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx",
  ownerHelpers: "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
  ownerRoute: "app/api/ofertas-locales/owner/[id]/route.ts",
  ownerUpdate: "app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper.ts",
  ownerDetail: "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
  ownerAi: "app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx",
  publishRoute: "app/api/ofertas-locales/publish/route.ts",
  publicOffersRoute: "app/api/ofertas-locales/public-offers/route.ts",
  publicSearchRoute: "app/api/ofertas-locales/public-search/route.ts",
  publicOfferHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts",
  publicSearchHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts",
  publicItemCard: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx",
  publicItemDrawer: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx",
  publicOfferDrawer: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx",
  publicSearchClient: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  analyticsEvents: "app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts",
  geminiDoc: "docs/OFERTAS_GEMINI_PROVIDER_SCHEMA_COORDINATION.md",
  termDoc: "docs/OFERTAS_30_DAY_TERM_LIFECYCLE_COORDINATION.md",
  stripeDoc: "docs/OFERTAS_STRIPE_ENTITLEMENT_COORDINATION.md",
  leonixDoc: "docs/OFERTAS_LEONIX_AD_ID_COORDINATION.md",
  partnerDoc: "docs/OFERTAS_PARTNER_SYSTEM_COORDINATION.md",
  analyticsDoc: "docs/OFERTAS_ANALYTICS_COORDINATION.md",
  assetDoc: "docs/OFERTAS_ASSET_REPLACEMENT_COORDINATION.md",
  checklistDoc: "docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md",
};

for (const file of Object.values(files)) {
  assert.ok(exists(file), `Required file exists: ${file}`);
}

const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

// Lifecycle: parent privacy and child eligibility.
assert.match(src.publicOfferHelpers, /PUBLIC_OFFER_STATUSES[\s\S]*new Set\(\["approved"\]\)/, "public offers are approved-only");
assert.match(src.publicOfferHelpers, /isOfertaLocalPublicTermActive\(row\.published_at, row\.expires_at, now\)/, "expired public offers are excluded by public term");
assert.match(src.publicSearchRoute, /\.eq\("review_status", "approved"\)/, "public child search requires approved item review");
assert.match(src.publicSearchRoute, /\.eq\("is_active", true\)/, "public child search requires active item");
assert.match(src.publicSearchRoute, /\.eq\("ofertas_locales\.status", "approved"\)/, "public child search requires approved parent");
assert.match(src.publicSearchHelpers, /PUBLIC_PARENT_STATUSES[\s\S]*new Set\(\["approved"\]\)/, "public child helper is approved-parent only");
assert.match(src.publicSearchHelpers, /row\.review_status !== "approved"/, "public child helper rejects unapproved review state");
assert.match(src.publicSearchHelpers, /!row\.is_active/, "public child helper rejects inactive items");
assert.match(src.publicSearchHelpers, /isOfertaLocalPublicTermActive\(parent\.published_at, parent\.expires_at, now\)/, "public child helper excludes expired parent");

// Publish/resubmission: same parent, no duplicate for AI review context.
assert.match(src.publishRoute, /if \(aiReview\.ofertaLocalId\) \{[\s\S]*\.update\(updateRow\)[\s\S]*\.eq\("id", aiReview\.ofertaLocalId\)/, "AI publish updates same parent");
assert.match(src.publishRoute, /aiReviewCounts\.incompleteCount > 0/, "customer publish blocks incomplete AI review");
assert.match(src.ownerRoute, /OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES\.includes\(row\.status\)/, "owner update is state gated");
assert.match(src.ownerUpdate, /status:\s*"pending_review"/, "owner correction returns to pending review");
assert.match(src.ownerUpdate, /submitted_at:\s*now/, "owner resubmission refreshes submitted_at");
assert.match(src.ownerRoute, /"status" in raw \|\| "owner_id" in raw \|\| "internal_notes" in raw/, "owner cannot set privileged fields");

// Owner truth and action gating.
assert.match(src.ownerHelpers, /"rejected"/, "rejected status is owner-editable for correction");
assert.match(src.ownerHelpers, /parseOfertaLocalOwnerSafeRejectionNote/, "owner gets safe rejection reason parser");
assert.match(src.ownerHelpers, /publicResultsHrefForStatus[\s\S]*status === "approved" && !isExpired/, "owner public link is approved and not expired only");
assert.match(src.ownerHelpers, /publicResultsHrefForStatus\(row\.status, isExpired \|\| !termActive\)/, "owner public link requires active public term");
assert.match(src.ownerDetail, /assetsReadOnly/, "owner source assets are truthfully read-only");
assert.doesNotMatch(src.ownerDetail, /fake analytics|fake leads|fake payments|fake entitlement|fake renew/i, "owner dashboard avoids fake metrics/actions");
assert.doesNotMatch(src.ownerDetail, /replace.*onClick|renew.*onClick|republish.*onClick/i, "owner dashboard has no fake replace/renew action");
assert.match(src.ownerAi, /SCANNABLE_OWNER_STATUSES[\s\S]*"draft"[\s\S]*"submitted"[\s\S]*"pending_review"/, "owner scans are limited to supported pre-approval states");
assert.match(src.ownerAi, /SCANNABLE_OWNER_STATUSES\.has\(offerStatus\)/, "owner scan button uses state allow-list");

// Admin operations.
assert.match(src.adminMutations, /rejection_reason_required/, "admin rejection requires a reason");
assert.match(src.adminMutations, /unresolved_review_items/, "admin approval blocks unresolved review items");
assert.match(src.adminMutations, /\.in\("review_status", \["pending", "needs_review"\]\)/, "admin unresolved review check covers pending and needs_review");
assert.match(src.adminMutations, /\.eq\("review_status", "approved"\)/, "admin approval activates approved children only");
assert.match(src.adminMutations, /action === "reject" \|\| action === "archive"[\s\S]*is_active: false/, "admin rejection/archive keep children private");
assert.match(src.adminRoute, /rejection_reason_required[\s\S]*422/, "admin API reports rejection reason validation");
assert.match(src.adminRoute, /unresolved_review_items[\s\S]*422/, "admin API reports unresolved item validation");
assert.match(src.adminList, /Nota interna \(requerida para rechazo\)/, "admin UI copy tells truth about rejection reason");
assert.match(src.adminActions, /buildAdminActionReturnUrl/, "admin server action uses existing action feedback return URL");
assert.match(src.adminActions, /Rejection reason is required\./, "admin feedback explains blank rejection reason");
assert.match(src.adminActions, /Resolve all pending or needs_review AI items before approval\./, "admin feedback explains unresolved item approval block");
assert.match(src.adminActions, /Review action failed\. Try again or inspect the offer state\./, "admin feedback uses generic unexpected failure message");
assert.match(src.adminList, /name="return_to"[\s\S]*value=\{returnTo\}/, "admin form preserves current offer return URL");
assert.match(src.adminList, /name="target_label"[\s\S]*value=\{item\.businessName\}/, "admin form passes safe target label for feedback");
assert.doesNotMatch(src.adminList, /emailed|notified|notification sent|cliente fue notificado/i, "admin UI does not claim fake notifications");

// Public parity and privacy.
assert.match(src.publicSearchHelpers, /sourceCropHref: getSafeOfertaLocalSourceAssetHref\(row\.source_crop_url\)/, "public item exposes real crop href");
assert.match(src.publicSearchHelpers, /sourcePage: row\.source_page/, "public item exposes source page");
assert.match(src.publicSearchHelpers, /sourceBbox: parseOfertaLocalPublicSourceBbox\(row\.source_bbox\)/, "public detail keeps bbox");
assert.match(src.publicItemCard, /item\.sourceCropHref[\s\S]*item\.sourceAssetHref/, "public item card uses crop with fallback source");
assert.match(src.publicItemDrawer, /item\.sourceCropHref[\s\S]*item\.sourceAssetHref/, "public item drawer uses crop with fallback source");
assert.match(src.publicSearchHelpers, /priceAmount: row\.price_amount/, "public item preserves decimal price amount");
assert.match(src.publicSearchHelpers, /itemName: sanitizePublicText\(row\.item_name/, "public item uses reviewed/corrected item title");
const publicItemMapper = fromMarker(src.publicSearchHelpers, "export function mapOfertaLocalPublicSearchRowToItem");
const publicOfferMapper = fromMarker(src.publicOfferHelpers, "export function mapOfertaLocalPublicOfferRowToCard");
assert.doesNotMatch(publicItemMapper, /provider:|normalizerProvider:|internalError:|storagePath:|internalNotes:|ownerId:/, "public item model does not return internal provider/storage/owner fields");
assert.doesNotMatch(publicOfferMapper, /provider:|normalizerProvider:|internalError:|storagePath:|internalNotes:|ownerId:/, "public offer model does not return internal provider/storage/owner fields");

// Cupones separation.
assert.match(src.publicSearchClient, /const floatingShoppingListCart = !isCupones \?/, "Cupones hides shopping list cart");
assert.match(src.publicSearchClient, /\{!isCupones && selectedItem \?/, "Cupones does not open product list drawer");
assert.doesNotMatch(src.publicOfferDrawer, /addToList|shoppingList|quantity|claim|redeem|redemption code/i, "Cupones public drawer has no cart/list/claim controls");

// Handoff docs.
assert.match(src.geminiDoc, /exact|oferta_local_scan_jobs_provider_check|gemini_multimodal|Rollback SQL|Verification SQL|No schema migration was applied|No database write was performed/i, "Gemini handoff is implementation-ready");
assert.match(src.termDoc, /public term should start when the listing becomes publicly eligible/i, "30-day term doc states canonical start recommendation");
assert.match(src.termDoc, /approval\/publication/i, "30-day term doc covers approval/publication interaction");
assert.match(src.stripeDoc, /39900[\s\S]*19900[\s\S]*AI included[\s\S]*No fake success before Stripe/i, "Stripe handoff locks prices and no fake success");
assert.match(src.stripeDoc, /No `?\$598`?[\s\S]*No separate AI Stripe product[\s\S]*No optional AI metadata/i, "Stripe handoff prohibits retired commercial model");
assert.match(src.leonixDoc, /LNX-XXXXXXXX[\s\S]*Never let the browser generate/i, "Leonix ID handoff defines authoritative ID");
assert.match(src.partnerDoc, /verified_active/, "Partner handoff defines verified active status");
assert.match(src.partnerDoc, /No customer self-assignment/i, "Partner handoff blocks self-assignment");
assert.match(src.partnerDoc, /price sorting/i, "Partner handoff preserves truthful price sorting");
assert.match(src.analyticsDoc, /planned event names only[\s\S]*ofertas_product_open[\s\S]*Cupones cannot emit shopping list events/i, "Analytics handoff is storage-aware and Cupones-safe");
assert.match(src.assetDoc, /keeps replacement unavailable[\s\S]*Old items do not remain active/i, "Asset replacement handoff keeps UI truthful and prevents item mixing");
assert.match(src.checklistDoc, /C1: DONE[\s\S]*D2: BLOCKED[\s\S]*G3: BLOCKED[\s\S]*N4: PARTIAL/, "Package 3 master checklist updated");

// No fake analytics implementation.
assert.match(src.analyticsEvents, /No tracking implementation, API calls, or storage/, "analytics events remain planned-only");

console.log("Package 3 Ofertas/Cupones lifecycle and handoff audit passed.");
