/**
 * Ofertas Locales draft-identity / hard-refresh hydration regression audit.
 *
 * Guards against the August 2026 regression class (introduced in
 * "fix(ofertas): complete first qa cleanup", carried forward until fixed
 * across 7cc1b221 and this pass):
 *   - a plain reload/hard-refresh/return-navigation being misclassified as
 *     a brand-new application and wiping the local draft + AI scan session
 *   - effects that can write pre-hydration/stale state back into storage in
 *     the same commit as the hydration effect
 *   - a canonical ofertaLocalId that has no recovery path once local/session
 *     browser storage is unavailable (a different Preview deployment origin,
 *     device, or cleared storage)
 *
 * Run: npm run ofertas-locales:draft-identity-hydration-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const IDENTITY = "app/lib/ofertas-locales/ofertasLocalesDraftIdentity.ts";
const USE_DRAFT = "app/lib/ofertas-locales/useOfertasLocalesDraft.ts";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const OWNER_HELPERS = "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts";
const OWNER_ROUTE = "app/api/ofertas-locales/owner/[id]/route.ts";
const PACKAGE_JSON = "package.json";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  const identity = read(IDENTITY);
  const useDraft = read(USE_DRAFT);
  const app = read(APP_CLIENT);
  const ownerHelpers = read(OWNER_HELPERS);
  const ownerRoute = read(OWNER_ROUTE);
  const pkg = read(PACKAGE_JSON);

  // --- A stored valid draft must survive an ordinary reload classification ---
  assert.doesNotMatch(
    identity,
    /active\s*&&\s*stored\s*&&\s*active\s*===\s*stored\s*&&\s*navigation\s*!==\s*"navigate"/,
    "regression: decision must not require an independent sessionStorage session match AND a " +
      "'reload'-classified navigation event to restore a stored draft — this combination is what " +
      "misclassified ordinary refreshes/back-navigation as a new application"
  );
  assert.match(
    identity,
    /if\s*\(\s*stored\s*\)\s*\{\s*return\s*"active";\s*\}/,
    "a stored local session id alone (no explicit new/fresh signal) must resolve to 'active'"
  );

  // --- Explicit new/reset signals must still work ---
  assert.match(identity, /intent === "new" \|\| fresh === "1" \|\| fresh === "1"|intent === "new"/, "explicit new intent must still force a reset decision");
  assert.match(identity, /fresh === "1" \|\| fresh === "true"/, "explicit fresh signal must still force a reset decision");

  // --- The hydration effect must not synthesize a second, independent applicationSessionId ---
  assert.doesNotMatch(
    useDraft,
    /peekStoredOfertaLocalApplicationSessionId/,
    "regression: hydration must not call a second independent loadOfertaLocalDraftFromStorage()/mergeDraft() " +
      "pass to derive storedSessionId — this can synthesize a different id than the one actually restored"
  );
  assert.match(
    useDraft,
    /stored\?\.applicationSessionId/,
    "storedSessionId must be derived from the same merged draft object used to restore state"
  );

  // --- The destructive wipe must remain reachable only for genuine new/reset cases ---
  assert.match(useDraft, /clearOfertaLocalDraftStorage\(\)/, "explicit reset path must still be able to clear the draft");
  assert.match(useDraft, /clearOfertaLocalAiScanSession\(\)/, "explicit reset path must still clear the AI scan session");
  assert.match(
    useDraft,
    /if\s*\(decision === "continue" \|\| decision === "active"\)\s*\{\s*if\s*\(stored\)\s*\{/,
    "restore branch must still be gated on the decision AND an actual stored draft"
  );

  // --- Mount-time effects in the wizard must not race hydration ---
  assert.doesNotMatch(
    app,
    /useEffect\(\(\) => \{\s*saveOfertaLocalAiScanSession\(\{/,
    "regression: the AI-scan-session save effect must be guarded by hasLoadedDraft — an unguarded " +
      "version can re-persist a stale pre-hydration id in the same commit as a legitimate clear"
  );
  assert.match(
    app,
    /if \(!hasLoadedDraft\) return;\s*saveOfertaLocalAiScanSession\(\{/,
    "AI-scan-session save effect must bail out before hasLoadedDraft is true"
  );
  assert.doesNotMatch(
    app,
    /useEffect\(\(\) => \{\s*if \(!draft\.membershipCtaLabel\.trim\(\)\) \{/,
    "regression: the membershipCtaLabel default effect must be guarded by hasLoadedDraft — an " +
      "unguarded version can clobber a real restored value against the pre-hydration empty draft"
  );
  assert.match(
    app,
    /if \(!hasLoadedDraft\) return;\s*if \(!draft\.membershipCtaLabel\.trim\(\)\) \{/,
    "membershipCtaLabel default effect must bail out before hasLoadedDraft is true"
  );

  // --- Canonical DB recovery when local/session storage is unavailable ---
  assert.match(
    app,
    /\/api\/ofertas-locales\/owner\/\$\{encodeURIComponent\(idToRecover\)\}/,
    "wizard must be able to recover a canonical application via the existing owner/[id] endpoint " +
      "when local draft state is unavailable but a durable id is present in the URL"
  );
  assert.match(
    app,
    /draftPatch/,
    "recovery path must consume the server-provided draftPatch to repopulate business/contact fields"
  );
  assert.match(
    app,
    /sanitizeAssetList\(patch\.flyerAssets\)/,
    "recovered flyerAssets must be sanitized the same way a locally-stored draft is sanitized"
  );

  // --- Durable identity in the URL ---
  assert.match(
    app,
    /params\.set\("id", effectiveOfertaLocalId\)/,
    "once a canonical id is known it must be reflected into the URL so a bookmark/reload/new-origin " +
      "visit can recover the application"
  );

  // --- Explicit start-fresh must remain the only user-confirmed destructive path in the client ---
  assert.match(
    app,
    /window\.confirm\(msg\)/,
    "the only in-app destructive reset must remain behind an explicit user confirmation"
  );

  // --- Server-side recovery surface ---
  assert.match(
    ownerHelpers,
    /export function mapOfertaLocalAdminRowToDraftRecoveryPatch/,
    "a canonical row -> draft-patch mapper must exist for recovery"
  );
  assert.match(ownerHelpers, /flyerAssets: Array\.isArray\(row\.flyer_assets\)/, "recovery patch must include flyerAssets");
  assert.match(ownerHelpers, /couponAssets: Array\.isArray\(row\.coupon_assets\)/, "recovery patch must include couponAssets");
  assert.match(
    ownerRoute,
    /draftPatch: OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES\.includes\(row\.status\)/,
    "owner/[id] GET must expose draftPatch, gated to owner-editable statuses"
  );

  assert.match(
    pkg,
    /ofertas-locales:draft-identity-hydration-regression-audit/,
    "package.json must wire this regression audit script"
  );

  console.log("Ofertas Locales draft-identity / hard-refresh hydration regression audit passed.");
}

run();
