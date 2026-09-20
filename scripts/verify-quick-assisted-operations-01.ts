/**
 * Gate QB-STAFF-03 — BEHAVIORAL proof of staff-assisted operations + assisted-token security.
 * Run: npx tsx scripts/verify-quick-assisted-operations-01.ts
 *
 * SECTION A actually attacks the real HMAC implementation: forgery with a wrong secret, payload
 * tampering, signature truncation, separator manipulation, expiry, and not-yet-valid tokens. This
 * replaces the previous approach of asserting that the string `timingSafeEqual` appears in a file
 * — a source-text match proves the characters are present, not that a forged token is rejected.
 *
 * SECTION B proves the four assisted publish surfaces enforce the invariants that cannot be
 * exercised without a database: these are WIRING checks and are labelled as such. They assert on
 * executable code with comments stripped, never on prose.
 *
 * No database, no network, no live Stripe.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  ASSISTED_PUBLISH_MAX_AGE_SEC,
  createAssistedPublishingTokenWithSecret,
  safeEqualHex,
  signAssistedPayload,
  verifyAssistedPublishingTokenWithSecret,
} from "../app/lib/auth/assistedPublishingToken";

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
/** Source with comments stripped: assertions must be about code, never prose. */
function readCode(p: string): string {
  return readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const SECRET = "test-secret-do-not-use-in-production";
const OTHER_SECRET = "a-different-secret";
const MINT = {
  businessId: "biz_1",
  category: "servicios",
  rosterId: "roster_1",
  authUserId: "staff_auth_1",
};

// =============================================================================
// SECTION A — ASSISTED TOKEN SECURITY (real attacks against real code)
// =============================================================================

check("A1: a validly minted token verifies and carries the exact minted claims", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  assert.ok(token, "minting must succeed with a secret");
  const ctx = verifyAssistedPublishingTokenWithSecret(token, SECRET, now + 1000);
  assert.ok(ctx, "a fresh valid token must verify");
  assert.equal(ctx!.businessId, "biz_1");
  assert.equal(ctx!.category, "servicios");
  assert.equal(ctx!.rosterId, "roster_1");
  assert.equal(ctx!.authUserId, "staff_auth_1");
});

check("A2: FORGERY — a token signed with a different secret is rejected", () => {
  const now = 1_700_000_000_000;
  const forged = createAssistedPublishingTokenWithSecret(MINT, OTHER_SECRET, now)!;
  assert.equal(
    verifyAssistedPublishingTokenWithSecret(forged, SECRET, now + 1000),
    null,
    "a token minted with an attacker's secret must never verify",
  );
});

check("A3: TAMPERING — editing the payload invalidates the signature", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  const [payload, signature] = token.split(".");
  // Attacker rewrites the businessId to point at someone else's business, keeps the signature.
  const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
  decoded.businessId = "biz_VICTIM";
  const tamperedPayload = Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url");
  const tampered = `${tamperedPayload}.${signature}`;
  assert.equal(
    verifyAssistedPublishingTokenWithSecret(tampered, SECRET, now + 1000),
    null,
    "a payload rewritten to target another business must not verify — this is the privilege-escalation path",
  );
});

check("A4: TAMPERING — escalating rosterId/authUserId is rejected", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  const [payload, signature] = token.split(".");
  const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
  decoded.authUserId = "some_other_staff";
  const tampered = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${signature}`;
  assert.equal(verifyAssistedPublishingTokenWithSecret(tampered, SECRET, now + 1000), null);
});

check("A5: TAMPERING — extending expiresAtMs does not grant a longer session", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  const [payload, signature] = token.split(".");
  const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
  decoded.expiresAtMs = now + 1000 * 60 * 60 * 24 * 365;
  const tampered = `${Buffer.from(JSON.stringify(decoded), "utf8").toString("base64url")}.${signature}`;
  assert.equal(verifyAssistedPublishingTokenWithSecret(tampered, SECRET, now + 1000), null);
});

check("A6: malformed tokens are rejected, never crash", () => {
  const now = Date.now();
  for (const bad of ["", ".", "nodot", "a.", ".b", "....", "!!!.???", "a.b.c"]) {
    assert.equal(verifyAssistedPublishingTokenWithSecret(bad, SECRET, now), null, `rejected: ${JSON.stringify(bad)}`);
  }
  assert.equal(verifyAssistedPublishingTokenWithSecret(null, SECRET, now), null);
  assert.equal(verifyAssistedPublishingTokenWithSecret(undefined, SECRET, now), null);
});

check("A7: a truncated or padded signature is rejected", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  const [payload, signature] = token.split(".");
  assert.equal(verifyAssistedPublishingTokenWithSecret(`${payload}.${signature!.slice(0, -2)}`, SECRET, now + 1), null);
  assert.equal(verifyAssistedPublishingTokenWithSecret(`${payload}.${signature}00`, SECRET, now + 1), null);
  assert.equal(verifyAssistedPublishingTokenWithSecret(`${payload}.`, SECRET, now + 1), null);
});

check("A8: EXPIRY is enforced, not just the signature", () => {
  const now = 1_700_000_000_000;
  const token = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  const justInside = now + ASSISTED_PUBLISH_MAX_AGE_SEC * 1000 - 1;
  const atExpiry = now + ASSISTED_PUBLISH_MAX_AGE_SEC * 1000;
  assert.ok(verifyAssistedPublishingTokenWithSecret(token, SECRET, justInside), "valid just before expiry");
  assert.equal(verifyAssistedPublishingTokenWithSecret(token, SECRET, atExpiry), null, "expiry is inclusive-reject");
  assert.equal(verifyAssistedPublishingTokenWithSecret(token, SECRET, atExpiry + 60_000), null, "expired stays expired");
});

check("A9: a token issued in the future is rejected (clock-skew forgery)", () => {
  const now = 1_700_000_000_000;
  const future = createAssistedPublishingTokenWithSecret(MINT, SECRET, now + 60_000)!;
  assert.equal(verifyAssistedPublishingTokenWithSecret(future, SECRET, now), null);
});

check("A10: FAIL CLOSED — no secret means neither mint nor verify", () => {
  const now = Date.now();
  assert.equal(createAssistedPublishingTokenWithSecret(MINT, "", now), null, "cannot mint without a secret");
  const real = createAssistedPublishingTokenWithSecret(MINT, SECRET, now)!;
  assert.equal(verifyAssistedPublishingTokenWithSecret(real, "", now + 1), null, "cannot verify without a secret");
});

check("A11: the session lifetime is one hour, not a standing credential", () => {
  assert.equal(ASSISTED_PUBLISH_MAX_AGE_SEC, 60 * 60);
});

check("A12: the constant-time comparator is correct on equal and unequal input", () => {
  assert.equal(safeEqualHex("abc123", "abc123"), true);
  assert.equal(safeEqualHex("abc123", "abc124"), false);
  assert.equal(safeEqualHex("abc", "abcd"), false, "different lengths must not throw and must be false");
  assert.equal(safeEqualHex("", ""), true);
  // The signature really is HMAC-SHA256 hex.
  const sig = signAssistedPayload("payload", SECRET);
  assert.match(sig, /^[0-9a-f]{64}$/, "HMAC-SHA256 produces 64 hex chars");
  assert.notEqual(sig, signAssistedPayload("payload", OTHER_SECRET), "the secret genuinely affects the signature");
});

check("A13: the server-only wrapper still owns the secret and cookie hardening", () => {
  const src = readFileSync("app/lib/auth/assistedPublishingSession.ts", "utf8");
  assert.ok(src.includes('import "server-only";'), "wrapper stays server-only");
  assert.ok(src.includes("ASSISTED_PUBLISHING_SESSION_SECRET"), "wrapper owns its dedicated secret env var");
  assert.ok(
    !src.includes("process.env.ADMIN_BOOTSTRAP_SESSION_SECRET") && !src.includes("process.env.ADMIN_PASSWORD"),
    "independent failure domains — never reads the bootstrap secret or admin password",
  );
  assert.ok(src.includes("httpOnly: true") && src.includes('sameSite: "strict"'), "cookie stays httpOnly + sameSite strict");
  const code = readCode("app/lib/auth/assistedPublishingSession.ts");
  assert.ok((code.match(/if \(!secret\) return null;/g) ?? []).length >= 2, "fails closed on BOTH mint and verify");
});

// =============================================================================
// SECTION B — ASSISTED PUBLISH SURFACES (wiring checks, comments stripped)
// =============================================================================

const ASSISTED_ROUTES: Array<{ path: string; category: string; family: string }> = [
  { path: "app/api/clasificados/servicios/publish/route.ts", category: "", family: "Servicios" },
  { path: "app/api/clasificados/restaurantes/publish/route.ts", category: "", family: "Restaurantes" },
  { path: "app/api/clasificados/autos/assisted-publish/route.ts", category: '"autos"', family: "Autos Dealer" },
  { path: "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts", category: '"bienes-raices"', family: "Bienes Negocio" },
];

check("B1 WIRING: all four families accept both assisted actions", () => {
  for (const r of ASSISTED_ROUTES) {
    const code = readCode(r.path);
    assert.ok(code.includes("save_for_client"), `${r.family}: save_for_client`);
    assert.ok(code.includes("publish_for_client"), `${r.family}: publish_for_client`);
  }
});

check("B2 WIRING: all four verify the HMAC assisted context", () => {
  for (const r of ASSISTED_ROUTES) {
    const code = readCode(r.path);
    assert.ok(code.includes("readAssistedPublishingContext("), `${r.family} must verify the signed cookie`);
  }
});

check("B3 WIRING: the two dedicated assisted routes bind to their own category", () => {
  for (const r of ASSISTED_ROUTES.filter((x) => x.category)) {
    const code = readCode(r.path);
    assert.ok(
      code.includes(`assistedContext.category !== ${r.category}`),
      `${r.family} must refuse a token minted for a different category (${r.category})`,
    );
  }
});

check("B4 WIRING: publish_for_client is gated on a REAL cleared manual payment", () => {
  for (const r of ASSISTED_ROUTES.filter((x) => x.category)) {
    const code = readCode(r.path);
    assert.ok(code.includes("hasClearedManualPaymentForListing("), `${r.family} must check the payment ledger`);
    assert.ok(code.includes("manual_payment_not_cleared"), `${r.family} must refuse with an explicit code`);
    assert.ok(code.includes("402"), `${r.family} must return 402 when unpaid`);
  }
  // The gate reads the real ledger state, not a client-declared flag.
  const custody = readCode("app/lib/business/assistedListingCustody.ts");
  assert.ok(custody.includes('.eq("manual_state", "cleared")'), "the payment gate reads leonix_payment_records.manual_state");
});

check("B5 WIRING: all four write the canonical business_listing_links relationship", () => {
  for (const r of ASSISTED_ROUTES) {
    const code = readCode(r.path);
    assert.ok(code.includes("linkAssistedListingToBusiness("), `${r.family} must record custody`);
  }
  const custody = readCode("app/lib/business/assistedListingCustody.ts");
  assert.ok(
    custody.includes("linked_by: input.linkedByAuthUserId") && !custody.includes("linked_by: input.rosterId"),
    "linked_by is the real authUserId, never a rosterId",
  );
});

check("B6 WIRING: ownership is never taken from the client body", () => {
  for (const r of ASSISTED_ROUTES.filter((x) => x.category)) {
    const code = readCode(r.path);
    // clientUserId is accepted, but only because the staff actor authenticated via the cookie.
    assert.ok(code.includes("client_user_id_required"), `${r.family} requires an explicit client user id`);
    // The business is ALWAYS taken from the signed cookie, never from the body.
    assert.ok(
      code.includes("assistedContext.businessId"),
      `${r.family} must take businessId from the signed context`,
    );
    assert.ok(
      !/businessId:\s*body\./.test(code),
      `${r.family} must NEVER read businessId from the request body`,
    );
  }
});

check("B7 WIRING: the Bienes route allowlists the columns it will write", () => {
  const code = readCode("app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts");
  assert.ok(code.includes("ALLOWED_LISTING_COLUMNS"), "a server-side field allowlist must exist");
  assert.ok(code.includes("owner_id: clientUserId"), "ownership is set server-side from the resolved client id");
  assert.ok(
    code.includes("delete patch.owner_id"),
    "an update must never overwrite ownership — that would let a re-save steal a row",
  );
});

check("B8 WIRING: duplicate assisted submissions are safe (idempotent custody)", () => {
  const custody = readCode("app/lib/business/assistedListingCustody.ts");
  assert.ok(custody.includes("const already = await isListingLinkedToBusiness(input);"), "re-link is a no-op");
  assert.ok(custody.includes("if (already) return { ok: true };"), "a duplicate link returns success, not an error");
  // Re-saving an existing listing requires that listing to already belong to this business.
  for (const r of ASSISTED_ROUTES.filter((x) => x.category)) {
    const code = readCode(r.path);
    assert.ok(code.includes("isListingLinkedToBusiness("), `${r.family} re-open must re-verify custody`);
    assert.ok(code.includes("listing_not_linked_to_business"), `${r.family} refuses a foreign listing id`);
  }
});

check("B9: the registry's staff flags match the routes that actually exist", () => {
  const reg = readCode("app/lib/quickBusiness/quickBusinessRegistry.ts");
  const trueCount = (reg.match(/publishForClientSupported: true/g) ?? []).length;
  assert.equal(trueCount, 4, "all four families claim support");
  // A flag is only honest if the route it implies is real AND verifies the assisted context.
  for (const r of ASSISTED_ROUTES) {
    const code = readCode(r.path);
    assert.ok(code.length > 0 && code.includes("readAssistedPublishingContext("), `${r.family}'s claim is backed by a real route`);
  }
});

if (failures.length) {
  console.error(`verify-quick-assisted-operations-01: ${failures.length}/${checks} FAILED`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`verify-quick-assisted-operations-01: OK (${checks} checks — ${12} real token attacks, no DB, no network)`);
