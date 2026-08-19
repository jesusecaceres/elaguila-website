/**
 * Globalization Build 03 — Gates 38/39 functional fixture tests. Runs the REAL functions against
 * constructed fixtures (no live DB — pure functions, same approach every prior SS0x fixture suite
 * this session already established). Proves genuine runtime behavior, not just source-text shape.
 *
 * Run: npx tsx scripts/verify-globalization-business-hub-trust-03-fixtures.ts
 */
import { strict as assert } from "node:assert";
import {
  isValidLeonixEndorsementKey,
  getLeonixEndorsementDefinitions,
} from "../app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import { toggleLeonixEndorsementVote, getLeonixEndorsementSummary } from "../app/lib/leonixCommunityTrust/leonixEndorsementServer";
import { createEmptyRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { buildRestaurantContactHub } from "../app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function run() {
// =================================================================================
// Gate 38 — endorsement dedupe/toggle fixture proofs
// =================================================================================

await check("valid endorsement key for its own category is accepted", () => {
  assert.equal(isValidLeonixEndorsementKey("restaurantes", "clean"), true);
  assert.equal(isValidLeonixEndorsementKey("servicios", "professional"), true);
});

await check("unsupported endorsement key is rejected", () => {
  assert.equal(isValidLeonixEndorsementKey("restaurantes", "not_a_real_key"), false);
});

await check("cross-category key confusion rejected — a restaurantes key is not valid for servicios and vice versa", () => {
  assert.equal(isValidLeonixEndorsementKey("servicios", "clean"), false);
  assert.equal(isValidLeonixEndorsementKey("restaurantes", "professional"), false);
});

await check("invalid category rejected outright", () => {
  assert.equal(isValidLeonixEndorsementKey("autos", "clean"), false);
});

// Minimal mock Supabase client — records whether .rpc() was ever called, so we can prove the
// self-vote / invalid-key rejections happen BEFORE any database call (fail closed, not just at
// the DB layer).
function mockSupabase(rpcResult: { data: unknown; error: unknown } = { data: [{ active: true, vote_count: 1 }], error: null }) {
  let rpcCalls: Array<{ fn: string; args: unknown }> = [];
  return {
    client: {
      rpc: async (fn: string, args: unknown) => {
        rpcCalls.push({ fn, args });
        return rpcResult;
      },
    } as any,
    calls: () => rpcCalls,
  };
}

await check("same user + same target + same endorsement key twice: application layer defers to the DB unique constraint (dedupe is a real DB guarantee, not an app-side check) — RPC is still called both times, proving no fake app-side short-circuit fabricates a result", async () => {
  const { client, calls } = mockSupabase();
  const r1 = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "user-1",
  });
  const r2 = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "user-1",
  });
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(calls().length, 2, "both calls must reach the atomic RPC — the DB unique index + toggle logic is the real dedupe guarantee");
});

await check("different endorsement key for the same user/target: allowed through to the RPC", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "great_food",
    userId: "user-1",
  });
  assert.equal(result.ok, true);
  assert.equal(calls().length, 1);
});

await check("different user for the same target/key: allowed through to the RPC", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "user-2",
  });
  assert.equal(result.ok, true);
  assert.equal(calls().length, 1);
});

await check("unsupported endorsement key is rejected BEFORE ever calling the RPC", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "not_a_real_key",
    userId: "user-1",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "invalid_endorsement_key");
  assert.equal(calls().length, 0, "an invalid key must never reach the database");
});

await check("invalid/unrecognized category rejected — same fail-closed behavior as an invalid key", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "autos",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "user-1",
  });
  assert.equal(result.ok, false);
  assert.equal(calls().length, 0);
});

await check("self-vote is blocked before ever calling the RPC when ownerUserId matches the voting user", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "owner-1",
    ownerUserId: "owner-1",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "self_vote_blocked");
  assert.equal(calls().length, 0);
});

await check("a non-owner voting is never blocked by the self-vote check", async () => {
  const { client, calls } = mockSupabase();
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "shopper-1",
    ownerUserId: "owner-1",
  });
  assert.equal(result.ok, true);
  assert.equal(calls().length, 1);
});

await check("removing a vote (toggle returning active:false) reflects a decremented count from the server response — never computed locally", async () => {
  const { client } = mockSupabase({ data: [{ active: false, vote_count: 3 }], error: null });
  const result = await toggleLeonixEndorsementVote(client, {
    category: "restaurantes",
    targetId: "11111111-1111-1111-1111-111111111111",
    endorsementKey: "clean",
    userId: "user-1",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.active, false);
    assert.equal(result.count, 3);
  }
});

await check("summary merge: zero-vote registry keys are truthfully represented as count:0, never omitted", async () => {
  // Only "clean" has real votes; the other 4 restaurantes keys have none.
  const { client } = mockSupabase({ data: [{ endorsement_key: "clean", vote_count: 7, user_voted: true }], error: null } as any);
  // getLeonixEndorsementSummary calls supabase.rpc("get_leonix_endorsement_summary", ...)
  const summary = await getLeonixEndorsementSummary(client, { category: "restaurantes", targetId: "t1", userId: "user-1" });
  assert.equal(summary.length, getLeonixEndorsementDefinitions("restaurantes").length);
  const clean = summary.find((s) => s.key === "clean");
  const service = summary.find((s) => s.key === "good_service");
  assert.ok(clean && clean.count === 7 && clean.userVoted === true);
  assert.ok(service && service.count === 0 && service.userVoted === false, "a genuinely zero-vote key must still appear, never dropped");
});

// =================================================================================
// Gate 39 — CTA fixture proofs (real phone/WhatsApp/Google review/social visibility truth)
// =================================================================================

await check("CTA: real phone number produces a visible, real tel: call button", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.phoneNumber = "+1 555 123 4567";
  const hub = buildRestaurantContactHub(draft, "es");
  assert.ok(hub, "hub must be built for a listing with real contact data");
  const callBtn = hub!.contactUs.find((b) => b.action === "call");
  assert.ok(callBtn, "call button must be present for a real phone number");
  assert.ok(callBtn!.href.startsWith("tel:"), "call CTA must use a real tel: href");
});

await check("CTA: missing phone number produces no call button at all — never a dead/disabled one", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.phoneNumber = undefined;
  const hub = buildRestaurantContactHub(draft, "es");
  const callBtn = hub?.contactUs.find((b) => b.action === "call");
  assert.equal(callBtn, undefined, "no call button may render when there is no real phone number");
});

await check("CTA: real WhatsApp number produces a visible, real wa.me href", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.whatsAppNumber = "15551234567";
  const hub = buildRestaurantContactHub(draft, "es");
  const waBtn = hub?.contactUs.find((b) => b.action === "whatsapp");
  assert.ok(waBtn, "WhatsApp button must be present for a real number");
  assert.ok(waBtn!.href.includes("wa.me"), "WhatsApp CTA must use a real wa.me href");
});

await check("CTA: missing WhatsApp number produces no WhatsApp button", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.whatsAppNumber = undefined;
  const hub = buildRestaurantContactHub(draft, "es");
  const waBtn = hub?.contactUs.find((b) => b.action === "whatsapp");
  assert.equal(waBtn, undefined);
});

await check("CTA: real Google review URL produces a visible review link", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.googleReviewUrl = "https://g.page/r/fixture-restaurant/review";
  const hub = buildRestaurantContactHub(draft, "es");
  const googleLink = hub?.reviews.find((r) => r.id === "google-reviews" || /google/i.test(r.id));
  assert.ok(googleLink, "a real Google review URL must produce a visible review link");
});

await check("CTA: missing Google review URL produces no Google review link — never a fallback destination", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.googleReviewUrl = undefined;
  draft.yelpReviewUrl = undefined;
  const hub = buildRestaurantContactHub(draft, "es");
  assert.equal(hub?.reviews.length ?? 0, 0, "no review link may render when no provider URL is set");
});

await check("CTA: real social URL (Instagram) produces a visible social chip", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  draft.instagramUrl = "https://instagram.com/fixturerestaurant";
  const hub = buildRestaurantContactHub(draft, "es");
  assert.ok((hub?.social.length ?? 0) > 0, "a real social URL must produce a visible social entry");
});

await check("CTA: missing social URLs produce zero social chips — no generic icon pointing nowhere", () => {
  const draft = createEmptyRestauranteDraft();
  draft.businessName = "Fixture Restaurant";
  // all social fields already undefined from createEmptyRestauranteDraft()
  const hub = buildRestaurantContactHub(draft, "es");
  assert.equal(hub?.social.length ?? 0, 0);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-business-hub-trust-03-fixtures: PASS");
}

void run();
