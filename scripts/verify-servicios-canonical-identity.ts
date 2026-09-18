/**
 * SERVICIOS — ONE APPLICATION = ONE CANONICAL LISTING UUID (regression for production rows
 * SERV-2026-000111…115: one owner, one business, five separate pending_payment listings whose slugs
 * became name, name-2, name-3, name-4, name-5).
 *
 * ROOT CAUSE: the Application form's non-edit mount effect wiped the primed canonical-id key every
 * time it mounted while restoring only the draft, so "Back to edit" / returning after a cancelled
 * Stripe checkout made the next pending-payment save carry no `existingListingId`; the publish route
 * (correctly) INSERTed a new row. Fix: the identity is bound to the draft (serviciosDraftListingIdentity).
 *
 * Execution-first: this drives the REAL `postServiciosPublishApi` client wrapper against a mock
 * publish server that implements the route's documented contract (existingListingId → UPDATE the same
 * row; none → INSERT with the next free slug). Then source guards pin the removal of the wipe.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-canonical-identity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

// ---- browser-ish globals the real client wrapper needs -------------------------------------------
class FakeStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? (this.m.get(k) as string) : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const session = new FakeStorage();
(globalThis as any).window = { sessionStorage: session };
(globalThis as any).sessionStorage = session;

// ---- mock publish server = the route's identity contract -----------------------------------------
type Row = { id: string; slug: string; leonixAdId: string; status: string; businessName: string };
let rows: Row[] = [];
const requests: { existingListingId?: string; businessName: string }[] = [];
let seq = 0;
function slugify(n: string) { return n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "borrador"; }
function allocateSlug(base: string) {
  let c = base; let i = 1;
  while (rows.some((r) => r.slug === c)) { i += 1; c = `${base}-${i}`; }
  return c;
}
(globalThis as any).fetch = async (_url: string, init: { body: string }) => {
  const body = JSON.parse(init.body) as { existingListingId?: string; state?: { businessName?: string } };
  const businessName = String(body.state?.businessName ?? "");
  requests.push({ existingListingId: body.existingListingId, businessName });
  let row: Row | undefined;
  if (body.existingListingId) {
    row = rows.find((r) => r.id === body.existingListingId);
    if (!row) return new Response(JSON.stringify({ ok: false, error: "listing_not_found" }), { status: 404 }); // fail closed, never INSERT
    row.businessName = businessName; // rename updates the SAME row and keeps its slug (route adopts the row's own slug)
  } else {
    seq += 1;
    row = { id: `uuid-${seq}`, slug: allocateSlug(slugify(businessName)), leonixAdId: `SERV-2026-${String(110 + seq).padStart(6, "0")}`, status: "pending_payment", businessName };
    rows.push(row);
  }
  return new Response(JSON.stringify({ ok: true, pendingPayment: true, listingId: row.id, leonixAdId: row.leonixAdId, slug: row.slug, listingStatus: row.status }), { status: 200 });
};

async function main() {
  const client: any = await import("../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient");
  const identity: any = await import("../app/(site)/clasificados/publicar/servicios/lib/serviciosDraftListingIdentity");
  const def: any = await import("../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState");

  const stateFor = (businessName: string) => ({ ...def.createDefaultClasificadosServiciosState(), businessName });
  const save = () => client.postServiciosPublishApi({ state: stateFor(currentName), lang: "es", accessToken: "t", activationMode: "pending_payment" });
  let currentName = "Plomería León del Valle QA";

  /** What the Application form's non-edit mount effect now does (mirrors the component exactly). */
  const applicationRemount = () => {
    const restored = identity.reconcileServiciosPrimedIdentityOnApplicationMount(identity.readServiciosDraftListingIdentity(session), {
      listingId: session.getItem(client.SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY),
      slug: session.getItem(client.SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY),
    });
    client.primeServiciosExistingPublicSlug(restored.slug);
    client.primeServiciosExistingListingId(restored.listingId);
  };

  // ---------------------------------------------------------------------------------------------
  await check("A. first valid pending-payment save creates exactly one listing and returns its canonical identity", async () => {
    const { data } = await save();
    assert.equal(data.ok, true);
    assert.equal(rows.length, 1);
    assert.equal(requests[0].existingListingId, undefined, "a first save may not declare an id");
    assert.equal(data.listingId, "uuid-1");
    assert.match(String(data.leonixAdId), /^SERV-2026-/);
  });

  await check("C. the client persists the canonical identity immediately (draft-bound + primed)", () => {
    const bound = identity.readServiciosDraftListingIdentity(session);
    assert.equal(bound?.listingId, "uuid-1");
    assert.equal(session.getItem(client.SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY), "uuid-1");
  });

  await check("D/E. Stripe cancel → return to the Application form (remount) → retry: SAME listing, no -2 slug", async () => {
    applicationRemount();
    assert.equal(session.getItem(client.SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY), "uuid-1", "remount must RESTORE identity, not wipe it");
    await save();
    assert.equal(requests.at(-1)?.existingListingId, "uuid-1");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].slug, "plomeria-leon-del-valle-qa");
  });

  await check("F. cancel/retry checkout three more times: still listing A", async () => {
    for (let i = 0; i < 3; i++) { applicationRemount(); await save(); }
    assert.equal(rows.length, 1);
    assert.ok(requests.slice(1).every((r) => r.existingListingId === "uuid-1"));
  });

  await check("G. preview → edit → preview → resubmit: still listing A", async () => {
    applicationRemount(); // Back to edit
    await save();         // edited resubmit from preview
    assert.equal(rows.length, 1);
  });

  await check("J. renaming the business updates the SAME row and keeps its public slug", async () => {
    currentName = "Plomería León del Valle Premium";
    await save();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].slug, "plomeria-leon-del-valle-qa", "slug stays stable across a rename");
    assert.equal(rows[0].businessName, "Plomería León del Valle Premium");
    currentName = "Plomería León del Valle QA";
  });

  await check("resilience: even if the primed key is wiped, the draft-bound identity still resolves A", async () => {
    client.primeServiciosExistingListingId(null);
    client.primeServiciosExistingPublicSlug(null);
    await save();
    assert.equal(requests.at(-1)?.existingListingId, "uuid-1");
    assert.equal(rows.length, 1);
  });

  await check("never listing B for the same application (whole scenario)", () => {
    assert.equal(rows.length, 1);
    assert.equal(new Set(rows.map((r) => r.leonixAdId)).size, 1);
    assert.ok(!rows.some((r) => /-\d+$/.test(r.slug)), "no -N duplicate slug");
  });

  await check("CONTROL (proves the harness catches the original bug): with NO draft-bound identity and a wiped primed key, the next save INSERTs a duplicate -2", async () => {
    const savedRows = rows.slice(); const savedReq = requests.length;
    identity.clearServiciosDraftListingIdentity(session);
    client.primeServiciosExistingListingId(null);
    client.primeServiciosExistingPublicSlug(null);
    await save();
    assert.equal(requests.at(-1)?.existingListingId, undefined);
    assert.equal(rows.length, savedRows.length + 1);
    assert.equal(rows.at(-1)?.slug, "plomeria-leon-del-valle-qa-2");
    rows = savedRows; requests.length = savedReq; seq = savedRows.length; // undo control
    identity.rememberServiciosDraftListingIdentity(session, { listingId: "uuid-1", leonixAdId: rows[0].leonixAdId, slug: rows[0].slug });
  });

  await check("a genuinely NEW application (draft deleted) still gets its own listing — identity is not over-reused", async () => {
    identity.clearServiciosDraftListingIdentity(session);
    client.primeServiciosExistingListingId(null);
    client.primeServiciosExistingPublicSlug(null);
    currentName = "Otra Empresa Distinta";
    applicationRemount();
    await save();
    assert.equal(rows.length, 2);
    assert.equal(rows[1].slug, "otra-empresa-distinta");
    assert.equal(requests.at(-1)?.existingListingId, undefined);
  });

  await check("server contract: a declared existingListingId that cannot resolve fails closed (404), it never INSERTs", async () => {
    const before = rows.length;
    const { res } = await client.postServiciosPublishApi({ state: stateFor("X"), lang: "es", accessToken: "t", existingListingId: "does-not-exist" });
    assert.equal(res.status, 404);
    assert.equal(rows.length, before);
  });

  // ---- pure helpers -----------------------------------------------------------------------------
  await check("resolveServiciosExistingListingId precedence: explicit > primed > draft-bound > undefined", () => {
    const r = identity.resolveServiciosExistingListingId;
    assert.equal(r({ explicit: "e", sessionPrimed: "p", draftIdentity: { listingId: "d", leonixAdId: null, slug: null } }), "e");
    assert.equal(r({ sessionPrimed: "p", draftIdentity: { listingId: "d", leonixAdId: null, slug: null } }), "p");
    assert.equal(r({ draftIdentity: { listingId: "d", leonixAdId: null, slug: null } }), "d");
    assert.equal(r({}), undefined);
    assert.equal(r({ explicit: "  ", sessionPrimed: "" }), undefined);
  });
  await check("a save that returns no listing id never records an identity", () => {
    const s = new FakeStorage();
    identity.rememberServiciosDraftListingIdentity(s, { listingId: "  " });
    assert.equal(identity.readServiciosDraftListingIdentity(s), null);
  });
  await check("corrupt stored identity is ignored, never thrown", () => {
    const s = new FakeStorage();
    s.setItem(identity.SERVICIOS_DRAFT_LISTING_IDENTITY_SESSION_KEY, "{not json");
    assert.equal(identity.readServiciosDraftListingIdentity(s), null);
  });

  // ---- source guards (supplementary to the executable checks above) ------------------------------
  await check("Application mount effect no longer wipes the canonical id (only Delete-draft clears it)", () => {
    const src = raw("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
    const wipes = src.match(/primeServiciosExistingListingId\(null\)/g) ?? [];
    assert.equal(wipes.length, 1, `expected exactly 1 explicit clear (deleteApplicationDraft), found ${wipes.length}`);
    assert.match(src, /reconcileServiciosPrimedIdentityOnApplicationMount/);
  });
  await check("clearing the draft also clears its bound identity (shared lifecycle)", () => {
    assert.match(raw("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage.ts"), /clearServiciosDraftListingIdentity\(window\.sessionStorage\)/);
  });
  await check("publish route still fails closed on a declared id (insert_forbidden branches intact)", () => {
    const route = raw("app/api/clasificados/servicios/publish/route.ts");
    assert.ok((route.match(/insert_forbidden/g) ?? []).length >= 2);
    assert.match(route, /IF `existingListingId` is supplied, the canonical row MUST resolve, ELSE FAIL CLOSED/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}
void main();
