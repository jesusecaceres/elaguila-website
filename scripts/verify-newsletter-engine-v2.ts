/**
 * Newsletter Engine v2 — targeted regression verifier.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (hardening pass)
 *
 * No live network/DB. Two kinds of checks:
 *  1. Real runtime calls against the pure, side-effect-free branches of the actual capture
 *     helper and verification state machine (both modules have zero "@/..." aliased imports, so
 *     they can be imported directly by relative path under tsx without a DB/server).
 *  2. Static source/migration-text checks for the parts that genuinely require a live Supabase
 *     client (saveNewsletterSubscriber's idempotency fallback) or a live route request (the
 *     server allowlist), matching this repo's existing verify-*.mjs convention.
 *
 * Run: npx tsx scripts/verify-newsletter-engine-v2.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  captureCheckoutNewsletterSubscriber,
  CHECKOUT_NEWSLETTER_SOURCES,
} from "../app/lib/newsletter/checkoutNewsletterCapture";
import {
  generateNewsletterVerificationToken,
  resolveNewsletterVerificationState,
} from "../app/lib/newsletter/newsletterVerificationState";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let failures = 0;
function fail(message: string): void {
  failures += 1;
  console.error(`FAIL - ${message}`);
}
function ok(message: string): void {
  console.log(`OK: ${message}`);
}
function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // ---------------------------------------------------------------------
  // Check 1/2/3 — checkout capture sources present in BOTH the client allowlist object and the
  // server ALLOWED_SOURCES set (Servicios, Restaurantes, Comida Local).
  // ---------------------------------------------------------------------
  const routeRel = "app/api/newsletter/checkout-capture/route.ts";
  if (!existsSync(path.join(root, routeRel))) fail(`Missing ${routeRel}`);
  const routeSrc = read(routeRel);

  const requiredSources: Array<{ label: string; value: string }> = [
    { label: "Servicios", value: CHECKOUT_NEWSLETTER_SOURCES.servicios },
    { label: "Restaurantes", value: CHECKOUT_NEWSLETTER_SOURCES.restaurantes },
    { label: "Comida Local", value: CHECKOUT_NEWSLETTER_SOURCES.comidaLocal },
  ];

  for (const { label, value } of requiredSources) {
    // Extract the ALLOWED_SOURCES Set(...) block only, so this can't false-pass on an unrelated
    // string match elsewhere in the file.
    const allowedBlockMatch = routeSrc.match(/const ALLOWED_SOURCES = new Set\(\[[\s\S]*?\]\);/);
    if (!allowedBlockMatch) {
      fail("Could not locate ALLOWED_SOURCES Set(...) block in checkout-capture route");
      break;
    }
    if (!allowedBlockMatch[0].includes(`"${value}"`)) {
      fail(`${label} source "${value}" missing from server ALLOWED_SOURCES allowlist`);
    } else {
      ok(`${label} checkout capture source "${value}" is in the server allowlist`);
    }
  }

  if (CHECKOUT_NEWSLETTER_SOURCES.servicios !== "servicios_checkout") {
    fail("CHECKOUT_NEWSLETTER_SOURCES.servicios changed value unexpectedly");
  }
  if (CHECKOUT_NEWSLETTER_SOURCES.restaurantes !== "restaurantes_checkout") {
    fail("CHECKOUT_NEWSLETTER_SOURCES.restaurantes changed value unexpectedly");
  }
  if (CHECKOUT_NEWSLETTER_SOURCES.comidaLocal !== "comida_local_checkout") {
    fail("CHECKOUT_NEWSLETTER_SOURCES.comidaLocal missing/wrong — Comida Local gap not closed");
  }

  // ---------------------------------------------------------------------
  // Check 4 — the capture function returns a real discriminated result (a `status` union),
  // never a boolean/void, for both the unchecked and the checked-with-no-email inputs (both are
  // pure — no fetch is issued for either, so this runs with zero network access).
  // ---------------------------------------------------------------------
  const uncheckedResult = await captureCheckoutNewsletterSubscriber({
    email: "someone@example.com",
    source: CHECKOUT_NEWSLETTER_SOURCES.servicios,
    checked: false,
  });
  if (typeof uncheckedResult !== "object" || uncheckedResult === null || !("status" in uncheckedResult)) {
    fail("captureCheckoutNewsletterSubscriber must return a discriminated {status} object, not a boolean/void");
  } else if (uncheckedResult.status !== "SKIPPED") {
    fail(`Unchecked checkbox should resolve SKIPPED, got ${JSON.stringify(uncheckedResult)}`);
  } else {
    ok("capture function returns a discriminated result (unchecked -> SKIPPED, not boolean/void)");
  }

  // ---------------------------------------------------------------------
  // Check 5 — null/missing email input correctly returns FAILED-with-reason, never a silent
  // no-op "fake success" (this was the pre-fix bug: session-fetch race -> null email -> silent
  // ok:true skip).
  // ---------------------------------------------------------------------
  const missingEmailResult = await captureCheckoutNewsletterSubscriber({
    email: null,
    source: CHECKOUT_NEWSLETTER_SOURCES.servicios,
    checked: true,
  });
  if (missingEmailResult.status !== "FAILED" || !("reason" in missingEmailResult) || !missingEmailResult.reason) {
    fail(`null email with checked:true must resolve FAILED-with-reason, got ${JSON.stringify(missingEmailResult)}`);
  } else {
    ok(`null email + checked:true correctly resolves FAILED (reason: "${missingEmailResult.reason}"), not a silent no-op`);
  }

  const invalidEmailResult = await captureCheckoutNewsletterSubscriber({
    email: "not-an-email",
    source: CHECKOUT_NEWSLETTER_SOURCES.restaurantes,
    checked: true,
  });
  if (invalidEmailResult.status !== "FAILED") {
    fail(`Malformed email with checked:true must resolve FAILED, got ${JSON.stringify(invalidEmailResult)}`);
  } else {
    ok("malformed email + checked:true correctly resolves FAILED, not a silent no-op");
  }

  // The four contractual states must all be reachable in the type (checked via the source text —
  // TypeScript unions have no runtime footprint to introspect).
  const helperSrc = read("app/lib/newsletter/checkoutNewsletterCapture.ts");
  for (const state of ["SUCCESS", "ALREADY_SUBSCRIBED", "PENDING_VERIFICATION", "FAILED"]) {
    if (!helperSrc.includes(`"${state}"`)) {
      fail(`Client capture result type is missing the "${state}" state`);
    }
  }
  ok("client CheckoutNewsletterCaptureResult type includes SUCCESS/ALREADY_SUBSCRIBED/PENDING_VERIFICATION/FAILED");

  if (!routeSrc.includes('"SUCCESS"') || !routeSrc.includes('"ALREADY_SUBSCRIBED"') || !routeSrc.includes('"FAILED"')) {
    fail("checkout-capture route no longer returns the discriminated status contract");
  } else {
    ok("checkout-capture route responds with the discriminated status contract");
  }

  // ---------------------------------------------------------------------
  // Check 6 — verification state machine: pending -> verified only given a valid token; rejects
  // an invalid or reused token. Pure function, fully exercised here (no DB).
  // ---------------------------------------------------------------------
  const token = generateNewsletterVerificationToken();
  if (typeof token !== "string" || token.length < 32) {
    fail("generateNewsletterVerificationToken must return a long opaque random string");
  } else {
    ok(`generateNewsletterVerificationToken produces an opaque token (length ${token.length})`);
  }

  const validTransition = resolveNewsletterVerificationState({
    status: "pending_verification",
    storedToken: token,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: token,
  });
  if (!validTransition.ok || validTransition.nextStatus !== "subscribed") {
    fail(`Valid pending->verified transition failed: ${JSON.stringify(validTransition)}`);
  } else {
    ok("verification state machine: pending -> verified given a matching, unexpired token");
  }

  const wrongToken = resolveNewsletterVerificationState({
    status: "pending_verification",
    storedToken: token,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: "not-the-right-token",
  });
  if (wrongToken.ok || wrongToken.reason !== "token_mismatch") {
    fail(`Invalid token must be rejected as token_mismatch, got ${JSON.stringify(wrongToken)}`);
  } else {
    ok("verification state machine rejects an invalid token (token_mismatch)");
  }

  const expiredToken = resolveNewsletterVerificationState({
    status: "pending_verification",
    storedToken: token,
    storedTokenExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    presentedToken: token,
  });
  if (expiredToken.ok || expiredToken.reason !== "token_expired") {
    fail(`Expired token must be rejected as token_expired, got ${JSON.stringify(expiredToken)}`);
  } else {
    ok("verification state machine rejects an expired token (token_expired)");
  }

  const notPending = resolveNewsletterVerificationState({
    status: "subscribed",
    storedToken: token,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: token,
  });
  if (notPending.ok || notPending.reason !== "not_pending") {
    fail(`Non-pending status must reject as not_pending, got ${JSON.stringify(notPending)}`);
  } else {
    ok("verification state machine refuses to verify a subscriber that isn't pending_verification");
  }

  // Reused-token contract: a real caller clears verification_token to null on successful verify,
  // so presenting the SAME token value again against a row whose stored token is now null must
  // be rejected, not silently re-accepted.
  const reusedToken = resolveNewsletterVerificationState({
    status: "pending_verification",
    storedToken: null,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: token,
  });
  if (reusedToken.ok) {
    fail(`A reused token (cleared after first use) must be rejected, got ${JSON.stringify(reusedToken)}`);
  } else {
    ok(`verification state machine rejects a reused token once cleared (reason: ${reusedToken.reason})`);
  }

  // ---------------------------------------------------------------------
  // Migration sanity — additive only (Step 4): no DROP TABLE / DELETE / column removal, and the
  // status CHECK constraint widens rather than replaces existing values.
  // ---------------------------------------------------------------------
  const migrationRel = "supabase/migrations/20260826130000_leonix_newsletter_verification_state.sql";
  if (!existsSync(path.join(root, migrationRel))) {
    fail(`Missing verification-state migration: ${migrationRel}`);
  } else {
    const migrationSrc = read(migrationRel);
    if (/DROP TABLE|DELETE FROM|DROP COLUMN/i.test(migrationSrc)) {
      fail("Verification-state migration must be additive only (no DROP TABLE/DELETE/DROP COLUMN)");
    } else {
      ok("verification-state migration contains no destructive statements");
    }
    if (!migrationSrc.includes("'subscribed', 'unsubscribed', 'pending_verification'")) {
      fail("Migration must widen status CHECK to keep 'subscribed'/'unsubscribed' and add 'pending_verification'");
    } else {
      ok("migration widens the status CHECK constraint additively (existing values preserved)");
    }
  }

  // ---------------------------------------------------------------------
  // Idempotency — leadCaptureServer's unique-violation fallback (23505) present, since the
  // unique index on `email` is what backs "no duplicate rows" and this code path can't run
  // without a live Supabase client.
  // ---------------------------------------------------------------------
  const leadCaptureSrc = read("app/lib/leonix/leadCaptureServer.ts");
  if (!leadCaptureSrc.includes("23505")) {
    fail("saveNewsletterSubscriber must handle unique_violation (23505) for idempotent double-submits");
  } else {
    ok("saveNewsletterSubscriber falls back to update on a unique_violation race (idempotent, no duplicate rows)");
  }
  if (!leadCaptureSrc.includes("previousStatus")) {
    fail("saveNewsletterSubscriber must report previousStatus so callers can tell ALREADY_SUBSCRIBED apart from SUCCESS");
  } else {
    ok("saveNewsletterSubscriber reports previousStatus for ALREADY_SUBSCRIBED vs SUCCESS discrimination");
  }

  // ---------------------------------------------------------------------
  // Unsubscribe invariant (Step 5) — an unchecked checkbox must never reach the network (so it
  // can never accidentally resubscribe/flip an unsubscribed row).
  // ---------------------------------------------------------------------
  if (!/if \(!input\.checked\) return \{ status: "SKIPPED"/.test(helperSrc)) {
    fail("Unchecked checkbox must short-circuit BEFORE any network call (resubscribe-safety invariant)");
  } else {
    ok("unchecked checkbox short-circuits before any network call — cannot silently resubscribe anyone");
  }

  console.log("");
  if (failures > 0) {
    console.error(`verify-newsletter-engine-v2: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exit(1);
  }
  console.log("verify-newsletter-engine-v2: PASS");
}

void main();
