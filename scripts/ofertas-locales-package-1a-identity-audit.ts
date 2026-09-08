/**
 * Package 1A — Ofertas Locales AI publish identity + review linkage regression audit.
 * Run: npx tsx scripts/ofertas-locales-package-1a-identity-audit.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PUBLISH_ROUTE = "app/api/ofertas-locales/publish/route.ts";
const SCAN_PREP_ROUTE = "app/api/ofertas-locales/scan-prep/route.ts";
const AI_DB_MAPPER = "app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts";
const ITEM_REVIEW_ACTIVATION = "app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts";
const ADMIN_MUTATIONS = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const PUBLIC_SEARCH_ROUTE = "app/api/ofertas-locales/public-search/route.ts";
const DOC = "docs/OFERTAS_GEMINI_PROVIDER_SCHEMA_COORDINATION.md";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function between(src: string, start: string, end: string): string {
  const startIdx = src.indexOf(start);
  assert.notEqual(startIdx, -1, `Missing start marker: ${start}`);
  const endIdx = src.indexOf(end, startIdx + start.length);
  assert.notEqual(endIdx, -1, `Missing end marker: ${end}`);
  return src.slice(startIdx, endIdx);
}

function run() {
  const publish = read(PUBLISH_ROUTE);
  const scanPrep = read(SCAN_PREP_ROUTE);
  const mapper = read(AI_DB_MAPPER);
  const activation = read(ITEM_REVIEW_ACTIVATION);
  const admin = read(ADMIN_MUTATIONS);
  const publicSearch = read(PUBLIC_SEARCH_ROUTE);
  const doc = read(DOC);

  assert.match(scanPrep, /\.from\("ofertas_locales"\)[\s\S]*\.insert\(row\)/, "scan-prep creates parent rows");
  assert.match(scanPrep, /\.from\("ofertas_locales"\)[\s\S]*\.update\(updatePayload\)/, "scan-prep updates existing parent rows");

  const aiPublishBranch = between(
    publish,
    "if (aiReview.ofertaLocalId) {",
    "canonical_parent_required"
  );

  assert.match(aiPublishBranch, /\.from\("ofertas_locales"\)[\s\S]*\.select\("id, owner_id, status, offer_type, draft_snapshot, leonix_ad_id"\)/, "AI branch fetches existing parent");
  assert.match(aiPublishBranch, /parent\.owner_id !== ownerId/, "AI branch rejects foreign-owner parent");
  assert.match(aiPublishBranch, /FINAL_PUBLISH_PARENT_STATUSES\.has\(parentStatus\)/, "AI branch validates eligible parent status");
  assert.match(aiPublishBranch, /parentMatchesDraftLane/, "AI branch validates parent lane");
  assert.match(aiPublishBranch, /validateAiReviewScanJob/, "AI branch validates scan-job linkage");
  assert.match(aiPublishBranch, /getAiReviewCounts/, "AI branch checks review completion");
  assert.match(aiPublishBranch, /aiReviewCounts\.incompleteCount > 0/, "AI branch blocks incomplete review");
  assert.match(aiPublishBranch, /\.update\(updateRow\)/, "AI branch updates the existing parent");
  assert.match(aiPublishBranch, /\.eq\("id", aiReview\.ofertaLocalId\)/, "AI branch scopes update to same parent id");
  assert.match(aiPublishBranch, /\.eq\("owner_id", ownerId\)/, "AI branch owner-scopes update");
  assert.doesNotMatch(aiPublishBranch, /\.insert\(/, "AI branch must not insert a duplicate parent");

  assert.match(publish, /invalid_ai_review_context/, "malformed or orphaned scan-job review context fails closed");
  assert.match(publish, /ai_review_parent_not_found/, "missing scan parent is rejected");
  assert.match(publish, /ai_review_parent_forbidden/, "foreign scan parent is rejected");
  assert.match(publish, /ai_review_parent_not_editable/, "finalized or ineligible parent is rejected");
  assert.match(publish, /ai_review_parent_mismatch/, "wrong parent lane is rejected");

  assert.match(publish, /canonical_parent_required/, "non-scan path fails closed instead of inserting a duplicate parent");
  assert.doesNotMatch(publish, /\.from\("ofertas_locales"\)[\s\S]*\.insert\(/, "publish route never inserts duplicate parents");

  assert.match(mapper, /oferta_local_id:\s*ofertaId/, "child rows keep original parent foreign key");
  assert.match(mapper, /scan_job_id:\s*scanJobId/, "child rows keep scan job linkage");
  assert.match(mapper, /normalizeOfertaLocalPrice/, "decimal price amount is normalized through Package 7 price contract");
  assert.match(mapper, /price_amount:\s*price\.amount/, "decimal price amount is preserved as normalized number");
  assert.match(mapper, /price_amount_cents:\s*price\.amountCents/, "decimal price cents are preserved for exact storage");
  assert.match(mapper, /source_crop_url:\s*sanitizeOptionalText\(item\.sourceCropUrl/, "crop URL is persisted on child row");
  assert.match(mapper, /source_bbox:\s*item\.sourceBbox/, "bbox is persisted on child row");

  assert.doesNotMatch(aiPublishBranch, /oferta_local_items[\s\S]*update/, "parent promotion must not rewrite child rows");
  assert.doesNotMatch(aiPublishBranch, /source_crop_url|source_bbox/, "parent promotion must not clear crop or bbox fields");

  assert.match(admin, /\.eq\("oferta_local_id", offerId\)[\s\S]*\.eq\("review_status", "approved"\)/, "admin approval activates approved children on same parent");
  assert.match(activation, /parentOfferStatus !== "approved"/, "item activation still requires approved parent");
  assert.match(publicSearch, /\.eq\("review_status", "approved"\)/, "public search requires approved items");
  assert.match(publicSearch, /\.eq\("is_active", true\)/, "public search requires active items");
  assert.match(publicSearch, /\.eq\("ofertas_locales\.status", "approved"\)/, "public search requires approved parent");

  assert.match(doc, /gemini_multimodal/, "coordination doc names runtime provider");
  assert.match(doc, /oferta_local_scan_jobs_provider_check/, "coordination doc names provider constraint");
  assert.match(doc, /No schema migration was applied/, "coordination doc states migration not applied");
  assert.match(doc, /No database write was performed/, "coordination doc states no DB write");

  console.log("Package 1A — Ofertas Locales identity audit passed.");
}

run();
