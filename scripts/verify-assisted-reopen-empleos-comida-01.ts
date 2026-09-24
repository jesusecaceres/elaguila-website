/**
 * WAVE 2 — staff Save / Reopen / Edit: EMPLEOS + COMIDA LOCAL.
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-assisted-reopen-empleos-comida-01.ts
 *
 * Pins that a staff REOPEN of a saved row loads the SERVER row (not a blank/browser-local form) through each
 * family's OWN row -> draft mapper, once per reopen, and that the server write path stays same-row and
 * custody-proved. Source assertions for the client wiring; the mappers, the owner policy, and both save routes
 * are EXECUTED (harness stubs: no database, no Stripe, no server).
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { __reset, __seed, __setAuthUsers, __rows, __onRpc } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { normalizeEmpleosQuickDraft } from "../app/(site)/publicar/empleos/shared/types/empleosQuickDraft";
import { hydrateQuickDraftFromEnvelope } from "../app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { buildEmpleosPublishEnvelopeFromQuick } from "../app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mergeComidaLocalDraftFromStorage } from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { comidaLocalDraftFromAssistedBoundRow } from "../app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import { resolveEmpleosRowOwner } from "../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy";

const ASSISTED_SECRET = "assisted-secret-harness-only";
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = ASSISTED_SECRET;
process.env.PROSPECT_PREVIEW_SESSION_SECRET = "preview-secret-harness-only";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}

const STAFF_EMAIL = "sales@leonix.test";
const STAFF_AUTH = "00000000-0000-4000-8000-000000000staff";
const ROSTER_ID = "roster-1";
const BIZ = "biz-1";

function signInAsSalesStaff(): void {
  __setCookies({ leonix_admin: "1", leonix_admin_operator_email: STAFF_EMAIL, leonix_admin_auth_user_id: STAFF_AUTH });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [{ id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role: "super_admin", is_active: true, auth_user_id: STAFF_AUTH }]);
}
function seedBusiness(): void {
  __seed("businesses", [
    { id: BIZ, display_name: "Taquería Sol", public_name: "Taquería Sol", legal_name: null, normalized_name: "taqueria sol", slug: "taqueria-sol", broad_business_type: "restaurant", status: "active", creation_source: "staff_assisted", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z" },
  ]);
}
function cookieFrom(res: { cookies: { get: (n: string) => { value: string } | undefined } }, name: string): string | undefined {
  return res.cookies.get(name)?.value;
}
function makeRequest(body: unknown, cookieJar: Record<string, string> = {}) {
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: () => null },
    cookies: { get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined) },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}
function boundToken(category: "empleos" | "comida-local", listingId: string): string {
  return createAssistedPublishingTokenWithSecret(
    { businessId: BIZ, category, rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId, assistedAction: "save_for_client", packageKey: null },
    ASSISTED_SECRET,
  )!;
}

function readyEmpleosDraft(title = "Niño's Landscaping lead") {
  return normalizeEmpleosQuickDraft({
    title,
    businessName: "El Sazón de Mamá",
    city: "Oakland",
    state: "CA",
    stateRegion: "CA",
    country: "United States",
    jobType: "tiempo-completo",
    schedule: "Lunes a viernes",
    payAmount: "28",
    payUnit: "hora",
    description: "Crew lead. Accents and ñ stay.",
    images: [{ id: "img1", url: "https://cdn.example.test/job.jpg", alt: "crew", isMain: true }],
    phone: "5105550100",
    whatsapp: "5105550101",
    smsPhone: "5105550102",
    email: "jobs@example.test",
  });
}

function comidaDraft(name: string) {
  return mergeComidaLocalDraftFromStorage({
    ...createEmptyComidaLocalDraft(),
    businessName: name,
    foodType: "tacos",
    cityDisplay: "Oakland",
    cityCanonical: "oakland",
    queVendes: "Tacos de canasta every morning at the corner stand.",
    phone: "5105550199",
    smsPhone: "5105550188",
  });
}

async function main() {
  // ── Source-level wiring ────────────────────────────────────────────────────────────────────────
  const empleosClient = read("app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx");
  const comidaClient = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  const comidaEditCtx = read("app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts");
  const empleosRoute = read("app/api/clasificados/empleos/listings/route.ts");
  const empleosDb = read("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
  const comidaRoute = read("app/api/clasificados/comida-local/publish/route.ts");

  check("W1: Empleos quick intake loads the bound server row via useAssistedBoundRow with its OWN envelope mapper", () => {
    assert.ok(empleosClient.includes('from "@/app/lib/sales/useAssistedBoundRow"'));
    assert.ok(empleosClient.includes('useAssistedBoundRow("empleos")'));
    const effect = empleosClient.slice(empleosClient.indexOf('useAssistedBoundRow("empleos")'));
    assert.ok(effect.includes("assistedBound.shouldHydrate"), "hydrates only when shouldHydrate");
    assert.ok(effect.includes("hydrateQuickDraftFromEnvelope(envelope)"), "uses the existing envelope -> draft mapper");
    assert.ok(effect.includes("listing_snapshot"), "reads the stored envelope from the row snapshot");
    assert.ok(effect.includes("patch(() => next)"), "applies to the same draft store Preview -> Edit reads");
    assert.ok(effect.includes("setServerListingId(listingId)"), "binds the server listing id");
    assert.ok(effect.includes("assistedBound.markHydrated()"), "marks hydrated");
    // No second mapper: the only quick-envelope mapper imported is the shared one.
    assert.equal((empleosClient.match(/hydrateQuickDraftFromEnvelope/g) ?? []).length >= 3, true);
  });

  check("W2: Comida Local intake loads the bound server row via useAssistedBoundRow with the category's OWN row mapper", () => {
    assert.ok(comidaClient.includes('from "@/app/lib/sales/useAssistedBoundRow"'));
    assert.ok(comidaClient.includes('useAssistedBoundRow("comida-local")'));
    const effect = comidaClient.slice(comidaClient.indexOf('useAssistedBoundRow("comida-local")'));
    assert.ok(effect.includes("assistedBound.shouldHydrate"));
    assert.ok(effect.includes("comidaLocalDraftFromAssistedBoundRow(row, listingId)"));
    assert.ok(effect.includes("setDraft(next)"));
    assert.ok(effect.includes("saveComidaLocalDraftToStorage(next)"), "the draft store Preview -> Edit reads");
    assert.ok(effect.includes("assistedBound.markHydrated()"));
    assert.ok(effect.includes("if (!hasLoadedDraft || editListingId) return;"), "never fights the owner edit workspace");
  });

  check("W3: Comida Local has ONE row -> draft mapper shared by the owner edit fetch and the assisted reopen", () => {
    assert.ok(comidaEditCtx.includes("export function comidaLocalEditHydrationFromRow("));
    assert.ok(comidaEditCtx.includes("return comidaLocalEditHydrationFromRow(data as Record<string, unknown>, listingId);"));
    assert.ok(comidaEditCtx.includes("mergeComidaLocalDraftFromStorage(row.listing_json)"));
    assert.equal((comidaEditCtx.match(/mergeComidaLocalDraftFromStorage\(row\.listing_json\)/g) ?? []).length, 1);
  });

  check("W4: server paths re-prove the custody ledger on existing-row branches", () => {
    assert.ok(empleosRoute.includes("isListingLinkedToBusiness") && empleosRoute.includes("assistedCustodyProven = true"));
    assert.ok(empleosRoute.includes("assistedCustody: assistedCustodyProven"));
    assert.ok(empleosDb.includes("assistedCustody?: boolean") && empleosDb.includes("resolveEmpleosRowOwner("));
    assert.ok(comidaRoute.includes("isListingLinkedToBusiness"));
    assert.ok(comidaRoute.includes('listingSource: "comida_local_public_listings"'));
    assert.ok(comidaRoute.includes("bodyListingId: null"), "draft id is never a row-id claim");
    assert.ok(comidaRoute.includes('error: "listing_not_found"'), "a bound row that is gone never inserts a second listing");
  });

  // ── Pure mappers / policy (executed) ───────────────────────────────────────────────────────────
  check("P1: Empleos server row snapshot envelope hydrates back into the quick draft", () => {
    const envelope = buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft(), "es");
    const row = { lane: "quick", listing_snapshot: { version: 1, envelope } };
    const snap = row.listing_snapshot as { envelope?: typeof envelope };
    const draft = hydrateQuickDraftFromEnvelope(snap.envelope!);
    assert.ok(draft);
    assert.equal(draft!.title, "Niño's Landscaping lead");
    assert.equal(draft!.smsPhone, "5105550102");
    assert.equal(draft!.email, "jobs@example.test");
  });

  check("P2: Comida Local row -> draft adopts the row's own draft_listing_id and every stored field", () => {
    const stored = comidaDraft("El Sazón de Mamá");
    const row = { id: "row-1", slug: "el-sazon", leonix_ad_id: "COMIDA-1", status: "pending_payment", draft_listing_id: "draft-col-1", updated_at: "2026-09-24T00:00:00Z", listing_json: { ...stored, draftListingId: "stale-local-id" } };
    const draft = comidaLocalDraftFromAssistedBoundRow(row, "row-1");
    assert.ok(draft);
    assert.equal(draft!.draftListingId, "draft-col-1");
    assert.equal(draft!.businessName, "El Sazón de Mamá");
    assert.equal(draft!.smsPhone, "5105550188");
    assert.equal(comidaLocalDraftFromAssistedBoundRow({ ...row, listing_json: null }, "row-1"), null, "never a blank draft");
  });

  check("P3: Empleos owner policy — customer path strict; assisted custody repairs drift but never moves rows between clients", () => {
    const strict = (existingOwner: string | null, incomingOwner: string | null) => resolveEmpleosRowOwner({ existingOwner, incomingOwner, assistedCustody: false });
    assert.equal(strict(null, "u1").ok, false);
    assert.equal(strict("u1", null).ok, false);
    assert.equal(strict("u1", "u2").ok, false);
    assert.deepEqual(strict("u1", "u1"), { ok: true, ownerUserId: "u1" });
    assert.deepEqual(strict(null, null), { ok: true, ownerUserId: null });
    const assisted = (existingOwner: string | null, incomingOwner: string | null) => resolveEmpleosRowOwner({ existingOwner, incomingOwner, assistedCustody: true });
    assert.deepEqual(assisted(null, "u1"), { ok: true, ownerUserId: "u1" }, "client appeared after first save");
    assert.deepEqual(assisted("u1", null), { ok: true, ownerUserId: "u1" }, "no client named keeps the owner");
    assert.equal(assisted("u1", "u2").ok, false);
    assert.deepEqual(assisted(null, null), { ok: true, ownerUserId: null });
  });

  // ── Route execution ────────────────────────────────────────────────────────────────────────────
  const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
  };
  const comida = (await import("../app/api/clasificados/comida-local/publish/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
  };
  const empleos = (await import("../app/api/clasificados/empleos/listings/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
  };
  const rpc = () =>
    __onRpc((fn: string) => {
      if (fn === "leonix_allocate_formatted") return { data: "COMIDA-2026-000001", error: null };
      return { data: null, error: { code: "P0001", message: `harness: no rpc handler for ${fn}` } };
    });

  await checkAsync("R1: Comida reopen re-save updates the SAME row even though the draft id differs from the row id", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    rpc();
    const minted = await custody.POST(makeRequest({ category: "comida-local", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish")!;
    const draft = comidaDraft("El Sazón de Mamá");
    const first = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft, draftListingId: draft.draftListingId, activationMode: "pending_payment" }, { leonix_assisted_publish: token }));
    const firstJson = (await first.json()) as { ok?: boolean; id?: string; listingId?: string; error?: string };
    assert.equal(first.status, 200, JSON.stringify(firstJson));
    const rowId = firstJson.listingId ?? firstJson.id!;
    assert.notEqual(rowId, draft.draftListingId, "row id and draft id are different identifiers");
    const bound = cookieFrom(first, "leonix_assisted_publish") ?? boundToken("comida-local", rowId);
    // Reopen: the intake hydrates from the server row, then staff edits and saves again.
    const stored = (__rows("comida_local_public_listings") as Record<string, unknown>[])[0]!;
    const reopened = comidaLocalDraftFromAssistedBoundRow(stored, rowId)!;
    assert.ok(reopened);
    const edited = { ...reopened, businessName: "El Sazón de Mamá (editado)" };
    const second = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft: edited, draftListingId: edited.draftListingId, activationMode: "pending_payment" }, { leonix_assisted_publish: bound }));
    const secondJson = (await second.json()) as { ok?: boolean; error?: string };
    assert.equal(second.status, 200, JSON.stringify(secondJson));
    const rows = __rows("comida_local_public_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1, "re-save must not insert");
    assert.equal(rows[0]!.id, rowId);
    assert.equal(rows[0]!.business_name, "El Sazón de Mamá (editado)");
    assert.notEqual(rows[0]!.status, "published");
    // A save with no draft id at all still lands on the bound row.
    const third = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft: { ...edited, businessName: "Tercera" }, activationMode: "pending_payment" }, { leonix_assisted_publish: bound }));
    assert.equal(third.status, 200, JSON.stringify(await third.json()));
    assert.equal((__rows("comida_local_public_listings") as unknown[]).length, 1);
  });

  await checkAsync("R2: Comida assisted context refuses a row the business does not hold (ledger), and a vanished bound row never inserts", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    rpc();
    __seed("comida_local_public_listings", [
      { id: "foreign-row", slug: "foreign", leonix_ad_id: "COMIDA-9", status: "published", package_tier: "basic", payment_status: "paid", owner_user_id: null, draft_listing_id: "foreign-draft", business_name: "Foreign", listing_json: {} },
    ]);
    const draft = comidaDraft("Attacker edit");
    const byBound = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft, activationMode: "pending_payment" }, { leonix_assisted_publish: boundToken("comida-local", "foreign-row") }));
    assert.equal(byBound.status, 403);
    const minted = await custody.POST(makeRequest({ category: "comida-local", businessId: BIZ }));
    const unbound = cookieFrom(minted, "leonix_assisted_publish")!;
    const byDraftId = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft: { ...draft, draftListingId: "foreign-draft" }, draftListingId: "foreign-draft", activationMode: "pending_payment" }, { leonix_assisted_publish: unbound }));
    assert.equal(byDraftId.status, 403, "a draft-id guess never reaches an owner-null row without custody");
    const gone = await comida.POST(makeRequest({ assistedAction: "save_for_client", draft, activationMode: "pending_payment" }, { leonix_assisted_publish: boundToken("comida-local", "no-such-row") }));
    assert.equal(gone.status, 404);
    const rows = __rows("comida_local_public_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.business_name, "Foreign");
  });

  await checkAsync("R3: Empleos reopen re-save updates the SAME row and keeps a draft a draft", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "empleos", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish")!;
    const first = await empleos.POST(makeRequest({ assistedAction: "save_for_client", mode: "draft", envelope: buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft(), "es") }, { leonix_assisted_publish: token }));
    const firstJson = (await first.json()) as { ok?: boolean; id?: string; error?: string };
    assert.equal(first.status, 200, JSON.stringify(firstJson));
    const rowId = firstJson.id!;
    const bound = cookieFrom(first, "leonix_assisted_publish") ?? boundToken("empleos", rowId);
    const stored = (__rows("empleos_public_listings") as Record<string, unknown>[])[0]!;
    const snap = stored.listing_snapshot as { envelope: Parameters<typeof hydrateQuickDraftFromEnvelope>[0] };
    const reopened = hydrateQuickDraftFromEnvelope(snap.envelope)!;
    assert.ok(reopened);
    const second = await empleos.POST(makeRequest({ assistedAction: "save_for_client", mode: "draft", envelope: buildEmpleosPublishEnvelopeFromQuick({ ...reopened, title: "Editado por staff" }, "es") }, { leonix_assisted_publish: bound }));
    const secondJson = (await second.json()) as { ok?: boolean; error?: string };
    assert.equal(second.status, 200, JSON.stringify(secondJson));
    const rows = __rows("empleos_public_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.id, rowId);
    assert.equal(rows[0]!.title, "Editado por staff");
    assert.equal(rows[0]!.lifecycle_status, "draft");
  });

  await checkAsync("R4: Empleos assisted custody keeps a client-owned row's owner when a later save names no client; refuses an unlinked row", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const envelope = buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft(), "es");
    __seed("empleos_public_listings", [
      { id: "11111111-1111-4111-8111-111111111111", slug: "job-a", lane: "quick", owner_user_id: "client-1", lifecycle_status: "published", moderation_reason: null, review_notes: null, published_at: "2026-09-01T00:00:00Z", created_at: "2026-09-01T00:00:00Z", listing_snapshot: { version: 1, envelope } },
      { id: "22222222-2222-4222-8222-222222222222", slug: "job-b", lane: "quick", owner_user_id: null, lifecycle_status: "draft", moderation_reason: null, review_notes: null, published_at: null, created_at: "2026-09-01T00:00:00Z", listing_snapshot: { version: 1, envelope } },
    ]);
    __seed("business_listing_links", [{ id: "link-a", business_id: BIZ, listing_source: "empleos_public_listings", listing_id: "11111111-1111-4111-8111-111111111111", status: "verified", linked_by: STAFF_AUTH }]);
    const ok = await empleos.POST(makeRequest({ assistedAction: "save_for_client", mode: "draft", envelope: buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft("Owner kept"), "es") }, { leonix_assisted_publish: boundToken("empleos", "11111111-1111-4111-8111-111111111111") }));
    assert.equal(ok.status, 200, JSON.stringify(await ok.json()));
    const a = (__rows("empleos_public_listings") as Record<string, unknown>[]).find((r) => r.id === "11111111-1111-4111-8111-111111111111")!;
    assert.equal(a.owner_user_id, "client-1", "owner is kept, not stripped");
    assert.equal(a.lifecycle_status, "published", "a draft save never demotes a live row");
    assert.equal(a.title, "Owner kept");
    const unlinked = await empleos.POST(makeRequest({ assistedAction: "save_for_client", mode: "draft", envelope: buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft("Attack"), "es") }, { leonix_assisted_publish: boundToken("empleos", "22222222-2222-4222-8222-222222222222") }));
    assert.equal(unlinked.status, 403);
    const b = (__rows("empleos_public_listings") as Record<string, unknown>[]).find((r) => r.id === "22222222-2222-4222-8222-222222222222")!;
    assert.notEqual(b.title, "Attack");
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-assisted-reopen-empleos-comida-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
