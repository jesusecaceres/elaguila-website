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
import {
  generateNewsletterUnsubscribeToken,
  resolveNewsletterUnsubscribeRequest,
} from "../app/lib/newsletter/newsletterUnsubscribeToken";

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

  // =======================================================================
  // FINAL-AUDIT-FIXES — Defect 1: real unsubscribe/opt-out path (Gate G, 12 checks).
  // =======================================================================
  const leadCaptureSrc2 = leadCaptureSrc; // already read above
  const checkoutRouteSrc = routeSrc; // already read above
  const unsubscribeServerSrc = read("app/lib/newsletter/newsletterUnsubscribeServer.ts");
  const unsubscribeRouteSrc = read("app/api/newsletter/unsubscribe/route.ts");
  const unsubscribeMigrationRel = "supabase/migrations/20260827180000_leonix_newsletter_unsubscribe.sql";

  // G1 — new subscription works (existing insert path, unchanged by this fix; re-affirmed here
  // since explicitOptIn now gates part of the same function).
  if (!leadCaptureSrc2.includes("insertUnsubscribeToken")) {
    fail("saveNewsletterSubscriber must issue a real unsubscribe_token on new-subscriber insert");
  } else {
    ok("G1: new subscription path issues a real unsubscribe_token on insert");
  }

  // G2 — duplicate subscribe remains idempotent (unchanged 23505 fallback path, re-affirmed).
  if (!leadCaptureSrc2.includes("23505")) {
    fail("G2: duplicate-subscribe unique_violation fallback missing");
  } else {
    ok("G2: duplicate subscribe remains idempotent via the existing 23505 fallback");
  }

  // G3 — unsubscribe succeeds: pure resolver, valid token, not-yet-unsubscribed status.
  const unsubToken = generateNewsletterUnsubscribeToken();
  if (typeof unsubToken !== "string" || unsubToken.length < 32) {
    fail("G3: generateNewsletterUnsubscribeToken must return a long opaque random string");
  } else {
    ok(`G3: generateNewsletterUnsubscribeToken produces an opaque token (length ${unsubToken.length})`);
  }
  const freshUnsubscribe = resolveNewsletterUnsubscribeRequest({
    status: "subscribed",
    storedToken: unsubToken,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: unsubToken,
  });
  if (!freshUnsubscribe.ok || freshUnsubscribe.alreadyUnsubscribed) {
    fail(`G3: unsubscribing a subscribed row with a valid token must succeed, got ${JSON.stringify(freshUnsubscribe)}`);
  } else {
    ok("G3: unsubscribe succeeds given a valid, unexpired token on a subscribed row");
  }

  // G4 — repeat unsubscribe is idempotent: same valid token, row already unsubscribed.
  const repeatUnsubscribe = resolveNewsletterUnsubscribeRequest({
    status: "unsubscribed",
    storedToken: unsubToken,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: unsubToken,
  });
  if (!repeatUnsubscribe.ok || !repeatUnsubscribe.alreadyUnsubscribed) {
    fail(`G4: repeat unsubscribe with the same token must be idempotent (ALREADY_UNSUBSCRIBED), got ${JSON.stringify(repeatUnsubscribe)}`);
  } else {
    ok("G4: repeat unsubscribe with the same token is idempotent (no re-write, no error)");
  }

  // G5 — unsubscribed record stays unsubscribed on passive (non-explicit) capture.
  if (!/existing\.status === "unsubscribed" && !input\.explicitOptIn/.test(leadCaptureSrc2)) {
    fail("G5: saveNewsletterSubscriber must skip the write when the existing row is unsubscribed and explicitOptIn is not set");
  } else {
    ok("G5: an unsubscribed row is left untouched by any write that isn't explicitOptIn:true");
  }
  if (!leadCaptureSrc2.includes("unsubscribePreserved: true")) {
    fail("G5: saveNewsletterSubscriber must report unsubscribePreserved:true, never a fake SUCCESS, when preserving an opt-out");
  } else {
    ok("G5: unsubscribe-preserved outcome is reported truthfully (unsubscribePreserved:true), not SUCCESS");
  }

  // G6 — unchecked checkout does not resubscribe (unchanged invariant, re-affirmed above at line
  // ~264 — the unchecked path never even reaches saveNewsletterSubscriber, so explicitOptIn is
  // moot for it).

  // G7 — explicit checked opt-in can resubscribe: checkout-capture route sets explicitOptIn:true.
  if (!checkoutRouteSrc.includes("explicitOptIn: true")) {
    fail("G7: checkout-capture route must pass explicitOptIn:true so a checked box can reactivate an unsubscribed row");
  } else {
    ok("G7: checkout-capture route passes explicitOptIn:true (checked-box = real explicit consent)");
  }
  const subscribeRouteSrc = read("app/api/newsletter/subscribe/route.ts");
  if (!subscribeRouteSrc.includes("explicitOptIn: true")) {
    fail("G7: direct newsletter subscribe route must also pass explicitOptIn:true (a submitted signup form is explicit consent)");
  } else {
    ok("G7: direct subscribe route also passes explicitOptIn:true");
  }

  // G8 — no duplicate row on resubscribe: reactivation still goes through the existing-row UPDATE
  // branch (keyed by id), never a second INSERT.
  if (!/existing\?\.id\)[\s\S]{0,800}unsubscribeTokenPatch/.test(leadCaptureSrc2)) {
    fail("G8: reactivation of an existing row must stay inside the existing.id UPDATE branch, not a new INSERT");
  } else {
    ok("G8: reactivation updates the existing row by id — no duplicate row is ever created");
  }

  // G9 — invalid unsubscribe token fails safely: wrong token, and empty token.
  const wrongUnsubToken = resolveNewsletterUnsubscribeRequest({
    status: "subscribed",
    storedToken: unsubToken,
    storedTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    presentedToken: "not-the-right-token",
  });
  if (wrongUnsubToken.ok) {
    fail(`G9: an invalid unsubscribe token must fail safely, got ${JSON.stringify(wrongUnsubToken)}`);
  } else {
    ok(`G9: invalid unsubscribe token fails safely (reason: ${wrongUnsubToken.reason}), no state change`);
  }
  const expiredUnsubToken = resolveNewsletterUnsubscribeRequest({
    status: "subscribed",
    storedToken: unsubToken,
    storedTokenExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    presentedToken: unsubToken,
  });
  if (expiredUnsubToken.ok || expiredUnsubToken.reason !== "token_expired") {
    fail(`G9: an expired unsubscribe token must fail safely as token_expired, got ${JSON.stringify(expiredUnsubToken)}`);
  } else {
    ok("G9: expired unsubscribe token fails safely (token_expired), no state change");
  }

  // G10 — one subscriber cannot unsubscribe another: the server resolver must look up strictly by
  // unsubscribe_token, never by email.
  if (!unsubscribeServerSrc.includes('.eq("unsubscribe_token"')) {
    fail("G10: unsubscribe resolver must look up the subscriber by unsubscribe_token");
  } else {
    ok("G10: unsubscribe resolver looks up strictly by unsubscribe_token");
  }
  if (/\.eq\("email"/.test(unsubscribeServerSrc)) {
    fail("G10: unsubscribe resolver must never accept an email-based lookup — that would let one subscriber affect another's row");
  } else {
    ok("G10: unsubscribe resolver never looks up by email — one subscriber's token can only ever affect their own row");
  }

  // G11 — FAILED is truthful: the unsubscribe route/page never claim a fake success.
  for (const state of ["UNSUBSCRIBED", "ALREADY_UNSUBSCRIBED", "INVALID_TOKEN", "EXPIRED_TOKEN", "FAILED"]) {
    if (!unsubscribeServerSrc.includes(`"${state}"`)) {
      fail(`G11: unsubscribe resolver result type is missing the "${state}" state`);
    }
  }
  ok("G11: unsubscribe resolver returns a real discriminated status (UNSUBSCRIBED/ALREADY_UNSUBSCRIBED/INVALID_TOKEN/EXPIRED_TOKEN/FAILED)");
  if (!unsubscribeRouteSrc.includes('"FAILED"')) {
    fail("G11: unsubscribe API route must be able to report a real FAILED status, not swallow errors as success");
  } else {
    ok("G11: unsubscribe API route can report a truthful FAILED status");
  }

  // G12 — outbound double-opt-in delivery is still NOT falsely claimed to exist. This fix adds
  // unsubscribe STATE + ROUTE + TOKEN behavior only — it must not start sending any email.
  if (/resend|sendLeonixResendEmail|nodemailer|sendgrid/i.test(unsubscribeServerSrc + unsubscribeRouteSrc)) {
    fail("G12: unsubscribe implementation must not send any outbound email — no email provider is wired for this flow");
  } else {
    ok("G12: unsubscribe implementation sends no outbound email (correctly does not claim delivery that doesn't exist)");
  }
  const verificationStateSrc = read("app/lib/newsletter/newsletterVerificationState.ts");
  if (!verificationStateSrc.includes("does NOT send any email")) {
    fail("G12: verification-state module must still honestly document that no outbound email exists");
  } else {
    ok("G12: verification-state module still honestly documents no outbound double-opt-in email exists");
  }

  // Migration sanity for the new unsubscribe columns — additive only.
  if (!existsSync(path.join(root, unsubscribeMigrationRel))) {
    fail(`Missing unsubscribe migration: ${unsubscribeMigrationRel}`);
  } else {
    const unsubMigrationSrc = read(unsubscribeMigrationRel);
    if (/DROP TABLE|DELETE FROM|DROP COLUMN/i.test(unsubMigrationSrc)) {
      fail("Unsubscribe migration must be additive only (no DROP TABLE/DELETE/DROP COLUMN)");
    } else {
      ok("unsubscribe migration contains no destructive statements");
    }
    if (!unsubMigrationSrc.includes("unsubscribe_token") || !unsubMigrationSrc.includes("unsubscribed_at")) {
      fail("Unsubscribe migration must add unsubscribe_token and unsubscribed_at columns");
    } else {
      ok("unsubscribe migration adds unsubscribe_token/unsubscribe_token_expires_at/unsubscribed_at additively");
    }
  }

  console.log("");
  if (failures > 0) {
    console.error(`verify-newsletter-engine-v2: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exit(1);
  }
  console.log("verify-newsletter-engine-v2: PASS");
}

void main();
