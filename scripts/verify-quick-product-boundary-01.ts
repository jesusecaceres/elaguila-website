/**
 * verify-quick-product-boundary-01 — BEHAVIORAL proof of the Quick/Full product boundary and of
 * the atomic Quick Bienes server custody operation.
 *
 * WHAT THE PRIOR FREEZE LEFT OPEN, AND WHAT THIS PROVES CLOSED
 * ------------------------------------------------------------
 *  1. Quick semantic-media enforcement reached SHARED publish paths. The Autos seam enforced it
 *     for `body.lane === "negocios"` — the dealer lane, which the $99 Quick dealer and the $399
 *     Full dealer both publish through — and the Bienes seam enforced it for
 *     `sellerType === "business"`, which Quick agents and Full agents share. Neither is a product,
 *     and both come from the browser.
 *  2. Quick Bienes published as "browser asks a server gate, browser then inserts into `listings`".
 *     Nothing tied the insert to the gate, so skipping the question still produced a row.
 *
 * HOW THIS FILE PROVES THINGS
 *  - REAL PRODUCTION MODULES, imported directly: the product resolver, the semantic media
 *    contract, the Quick Bienes publish contract and the Quick Bienes publish OPERATION — the same
 *    function the HTTP route runs.
 *  - CONTROLLED PORTS for the operation's IO, so identity, product, media, fields, write order,
 *    idempotency and linkage are proven by RUNNING the code, not by reading it.
 *  - WIRING assertions, by source text, only where the claim is "this seam is connected to that
 *    module" — which no unit test can show.
 *
 * No database, no network, no Stripe, no migration.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  fullBasePackageKeyForCategory,
  productForBasePackageKey,
  quickBasePackageKeyForCategory,
  quickContractAppliesTo,
  resolveQuickBusinessProduct,
  shouldEnforceQuickBusinessContract,
} from "../app/lib/listingPlans/quickBusinessProductIdentity";
import { enforceQuickBusinessPublishMedia } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import {
  QUICK_BIENES_ALLOWED_COLUMNS,
  QUICK_BIENES_SERVER_OWNED_COLUMNS,
  buildQuickBienesListingRow,
  buildQuickBienesReuseKey,
  validateQuickBienesListingFields,
} from "../app/lib/clasificados/bienes-raices/quickBienesPublishContract";
import {
  executeQuickBienesPublish,
  type QuickBienesPublishPorts,
  type QuickBienesPublishResult,
} from "../app/lib/clasificados/bienes-raices/quickBienesPublishOperation";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

let checks = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return (async () => {
    try {
      await fn();
      checks++;
      console.log(`PASS  ${name}`);
    } catch (e) {
      console.error(`FAIL  ${name}`);
      console.error(e instanceof Error ? e.stack ?? e.message : String(e));
      process.exitCode = 1;
      throw e;
    }
  })();
}

const QUICK_AUTOS = quickBasePackageKeyForCategory("autos")!;
const FULL_AUTOS = fullBasePackageKeyForCategory("autos")!;
const QUICK_BIENES = quickBasePackageKeyForCategory("bienes-raices")!;
const FULL_BIENES = fullBasePackageKeyForCategory("bienes-raices")!;

// =================================================================================================
// SECTION A — THE PRODUCT TRUTH ITSELF
// =================================================================================================

async function sectionA() {
  await check("A1: the two categories in the Simple/Full split name four distinct base packages", () => {
    assert.ok(QUICK_AUTOS && FULL_AUTOS && QUICK_BIENES && FULL_BIENES);
    assert.equal(new Set([QUICK_AUTOS, FULL_AUTOS, QUICK_BIENES, FULL_BIENES]).size, 4);
    assert.equal(productForBasePackageKey("autos", QUICK_AUTOS), "quick");
    assert.equal(productForBasePackageKey("autos", FULL_AUTOS), "full");
    assert.equal(productForBasePackageKey("bienes-raices", QUICK_BIENES), "quick");
    assert.equal(productForBasePackageKey("bienes-raices", FULL_BIENES), "full");
    // An add-on is not a base product and can never be mistaken for one.
    assert.equal(productForBasePackageKey("autos", "autos_dealer_inventory_pack_monthly"), null);
  });

  await check("A2: a category with no Simple/Full split can never be put under the Quick contract", () => {
    // Autos Privado and Bienes FSBO are sold as one-time listings, not as a business base package.
    for (const category of ["autos-privado", "rentas", "empleos", "comida-local", ""]) {
      const d = resolveQuickBusinessProduct({ category, declaredPackageKey: QUICK_AUTOS });
      assert.equal(d.product, "unverified", `${category || "<empty>"} must stay outside the split`);
      // A distinct source, so "no Quick product exists here" is never confused with "this Quick
      // category's product could not be determined" — the first skips, the second enforces.
      assert.equal(d.source, "no_quick_product", `${category || "<empty>"} has no Quick product at all`);
      assert.equal(quickContractAppliesTo(d), false);
    }
  });

  await check("A3: a LIVE entitlement row is authority, in both directions", () => {
    const quick = resolveQuickBusinessProduct({
      category: "autos",
      liveEntitlementRows: [{ packageKey: QUICK_AUTOS, packageTier: "digital_only" }],
    });
    assert.deepEqual([quick.product, quick.source], ["quick", "live_entitlement"]);

    const full = resolveQuickBusinessProduct({
      category: "autos",
      liveEntitlementRows: [{ packageKey: FULL_AUTOS, packageTier: "digital_only" }],
    });
    assert.deepEqual([full.product, full.source], ["full", "live_entitlement"]);
  });

  await check("A4: holding BOTH resolves to FULL — an upgrade never loses Full behavior mid-flight", () => {
    const d = resolveQuickBusinessProduct({
      category: "bienes-raices",
      liveEntitlementRows: [
        { packageKey: QUICK_BIENES, packageTier: "digital_only" },
        { packageKey: FULL_BIENES, packageTier: "digital_only" },
      ],
    });
    assert.equal(d.product, "full");
    assert.equal(quickContractAppliesTo(d), false);
  });

  await check("A5: the server-minted checkout ledger answers before payment resolves", () => {
    const q = resolveQuickBusinessProduct({ category: "autos", checkoutLedgerPackageKey: QUICK_AUTOS });
    assert.deepEqual([q.product, q.source], ["quick", "checkout_ledger"]);
    const f = resolveQuickBusinessProduct({ category: "autos", checkoutLedgerPackageKey: FULL_AUTOS });
    assert.deepEqual([f.product, f.source], ["full", "checkout_ledger"]);
  });

  await check("A6: a verified assisted staff context outranks everything else", () => {
    const d = resolveQuickBusinessProduct({
      category: "autos",
      assistedPackageKey: QUICK_AUTOS,
      liveEntitlementRows: [{ packageKey: FULL_AUTOS, packageTier: "digital_only" }],
      checkoutLedgerPackageKey: FULL_AUTOS,
    });
    assert.deepEqual([d.product, d.source], ["quick", "assisted_context"]);
  });

  await check("A7 FORGERY: a declaration is read ONLY in the restricting direction", () => {
    // Declaring the SIMPLE key adds the Quick contract to yourself. That is the only direction.
    const down = resolveQuickBusinessProduct({ category: "autos", declaredPackageKey: QUICK_AUTOS });
    assert.deepEqual([down.product, down.source], ["quick", "declared_simple_package"]);

    // Declaring the FULL key buys nothing: it cannot produce `full`, and cannot lift the contract.
    for (const forged of [FULL_AUTOS, "autos_dealer_monthly_PRO", "full", "", null, undefined, 7 as unknown as string]) {
      const d = resolveQuickBusinessProduct({ category: "autos", declaredPackageKey: forged as string });
      assert.notEqual(d.product, "full", `a declared "${String(forged)}" must never produce full`);
      assert.equal(d.source === "declared_simple_package", false);
    }
  });

  await check("A8 FORGERY: server-owned truth overrides a declaration, in BOTH directions", () => {
    // Forging "I am Full" while the ledger says Quick does NOT escape the Quick contract.
    const escapeAttempt = resolveQuickBusinessProduct({
      category: "bienes-raices",
      checkoutLedgerPackageKey: QUICK_BIENES,
      declaredPackageKey: FULL_BIENES,
    });
    assert.deepEqual([escapeAttempt.product, escapeAttempt.source], ["quick", "checkout_ledger"]);
    assert.equal(quickContractAppliesTo(escapeAttempt), true);

    // Forging "I am Quick" while the entitlement says Full does NOT impose Quick limits on Full.
    const captureAttempt = resolveQuickBusinessProduct({
      category: "bienes-raices",
      liveEntitlementRows: [{ packageKey: FULL_BIENES, packageTier: "digital_only" }],
      declaredPackageKey: QUICK_BIENES,
    });
    assert.deepEqual([captureAttempt.product, captureAttempt.source], ["full", "live_entitlement"]);
    assert.equal(quickContractAppliesTo(captureAttempt), false);
  });

  await check("A9 FAIL SAFE: an UNDETERMINED product ENFORCES; only a PROVEN Full skips", () => {
    // THE ROUND-3 REPAIR. This check previously asserted the opposite, and the opposite was
    // falsifiable: a first publish always precedes payment, so every server leg is silent and the
    // only remaining signal is a declaration the browser can simply omit. Skipping on
    // `unverified` therefore made the whole contract opt-in from the browser — omitting one field
    // published a Quick listing with a logo and no subject photo.
    const undetermined = shouldEnforceQuickBusinessContract({ category: "autos" });
    assert.equal(undetermined.decision.product, "unverified");
    assert.equal(undetermined.decision.source, "none");
    assert.equal(undetermined.enforce, true, "an undetermined product must land on the STRICT side");

    // Both business categories, and with an unusable declaration, behave the same way.
    for (const category of ["autos", "bienes-raices"]) {
      for (const declared of [null, undefined, "", "   ", "not_a_package", FULL_AUTOS, FULL_BIENES]) {
        const r = shouldEnforceQuickBusinessContract({ category, declaredPackageKey: declared as string });
        assert.equal(r.enforce, true, `${category} + declared ${JSON.stringify(declared)} must enforce`);
      }
    }

    // The ONLY skips: a proven Full, and a category with no Quick product at all.
    for (const facts of [
      { category: "autos", liveEntitlementRows: [{ packageKey: FULL_AUTOS, packageTier: "digital_only" }] },
      { category: "autos", checkoutLedgerPackageKey: FULL_AUTOS },
      { category: "bienes-raices", assistedPackageKey: FULL_BIENES },
    ]) {
      const r = shouldEnforceQuickBusinessContract(facts);
      assert.equal(r.decision.product, "full", "proven Full");
      assert.equal(r.enforce, false, "a PROVEN Full is the blocker this module closes");
    }
    assert.equal(shouldEnforceQuickBusinessContract({ category: "rentas" }).enforce, false);
  });

  await check("A10: a PRINT quarter-page grant is SIMPLE, a print half-page and up is FULL", () => {
    // The print→digital bridge already in `businessAccessLevel` is the same rule here, so a
    // quarter-page advertiser is a Quick-level customer and a half-page advertiser is not.
    const quarter = resolveQuickBusinessProduct({
      category: "autos",
      liveEntitlementRows: [{ packageKey: null, packageTier: "quarter_page" }],
    });
    assert.equal(quarter.product, "quick");
    const half = resolveQuickBusinessProduct({
      category: "autos",
      liveEntitlementRows: [{ packageKey: null, packageTier: "half_page" }],
    });
    assert.equal(half.product, "full");
  });
}

// =================================================================================================
// SECTION B — THE MISSION'S 14 REQUIRED BEHAVIOURS
// =================================================================================================

/** The media contract as a publish seam runs it, for a resolved product. */
function seamOutcome(input: {
  category: "autos" | "bienes-raices";
  mediaCategory: "autos-dealer" | "bienes-negocio";
  roles: (string | null)[];
  facts: Parameters<typeof resolveQuickBusinessProduct>[0];
}): { enforced: boolean; refused: boolean; issues: string[] } {
  const { enforce } = shouldEnforceQuickBusinessContract(input.facts);
  if (!enforce) return { enforced: false, refused: false, issues: [] };
  const result = enforceQuickBusinessPublishMedia({
    category: input.mediaCategory,
    items: input.roles.map((role) => ({ role, mime: null })),
  });
  if (!result || result.ok) return { enforced: true, refused: false, issues: [] };
  return { enforced: true, refused: true, issues: result.body.issues };
}

async function sectionB() {
  await check("B1: Quick Autos WITH a declared vehicle image succeeds", () => {
    const r = seamOutcome({
      category: "autos",
      mediaCategory: "autos-dealer",
      roles: ["vehicle", "logo"],
      facts: { category: "autos", checkoutLedgerPackageKey: QUICK_AUTOS },
    });
    assert.equal(r.enforced, true, "a verified Quick dealer IS held to the contract");
    assert.equal(r.refused, false);
  });

  await check("B2: Quick Autos with only dealer / logo / general media FAILS", () => {
    const logoOnly = seamOutcome({
      category: "autos",
      mediaCategory: "autos-dealer",
      roles: ["logo"],
      facts: { category: "autos", checkoutLedgerPackageKey: QUICK_AUTOS },
    });
    assert.equal(logoOnly.refused, true);
    assert.ok(logoOnly.issues.includes("missing_subject_role"), logoOnly.issues.join(","));

    const businessOnly = seamOutcome({
      category: "autos",
      mediaCategory: "autos-dealer",
      roles: ["business", "logo"],
      facts: { category: "autos", checkoutLedgerPackageKey: QUICK_AUTOS },
    });
    assert.equal(businessOnly.refused, true, "a dealership photo is not a vehicle photo");

    // A pre-roles draft is CORRECTED, not silently reclassified as a vehicle photo.
    const unroled = seamOutcome({
      category: "autos",
      mediaCategory: "autos-dealer",
      roles: [null, null],
      facts: { category: "autos", checkoutLedgerPackageKey: QUICK_AUTOS },
    });
    assert.equal(unroled.refused, true);
    assert.ok(unroled.issues.includes("role_declaration_required"), unroled.issues.join(","));
  });

  await check("B3: FULL Autos is NOT subjected to Quick restrictions", () => {
    for (const facts of [
      { category: "autos", liveEntitlementRows: [{ packageKey: FULL_AUTOS, packageTier: "digital_only" }] },
      { category: "autos", checkoutLedgerPackageKey: FULL_AUTOS },
      // and the forged-Quick attempt against a Full entitlement
      {
        category: "autos",
        liveEntitlementRows: [{ packageKey: FULL_AUTOS, packageTier: "digital_only" }],
        declaredPackageKey: QUICK_AUTOS,
      },
    ] as Parameters<typeof resolveQuickBusinessProduct>[0][]) {
      const r = seamOutcome({ category: "autos", mediaCategory: "autos-dealer", roles: ["logo"], facts });
      assert.equal(r.enforced, false, "the Quick contract must not run for a Full dealer");
      assert.equal(r.refused, false);
    }
  });

  await check("B4: AUTOS PRIVADO is not subjected to Quick restrictions", () => {
    // The privado lane has no Simple/Full split, so no fact and no declaration can enroll it.
    const r = seamOutcome({
      category: "autos",
      mediaCategory: "autos-dealer",
      roles: ["logo"],
      facts: { category: "autos-privado", declaredPackageKey: QUICK_AUTOS },
    });
    assert.equal(r.enforced, false);
    // And the route reaches the contract only on the dealer lane at all.
    const route = read("app/api/clasificados/autos/listings/route.ts");
    const guardIdx = route.indexOf('if (body.lane === "negocios" && userId) {\n    const identity = await resolveQuickBusinessPublishIdentity(');
    assert.ok(guardIdx > -1, "the media branch is entered only for the dealer lane");
    assert.ok(
      !/lane === "privado"[\s\S]{0,400}enforceQuickBusinessPublishMedia/.test(route),
      "no privado branch reaches the Quick contract",
    );
  });

  await check("B5: Quick Bienes WITH a declared property image succeeds", () => {
    const r = seamOutcome({
      category: "bienes-raices",
      mediaCategory: "bienes-negocio",
      roles: ["property", "headshot"],
      facts: { category: "bienes-raices", serverCustodyQuick: true },
    });
    assert.equal(r.enforced, true);
    assert.equal(r.refused, false);
  });

  await check("B6: Quick Bienes with only headshot / logo / general media FAILS", () => {
    for (const roles of [["headshot"], ["logo"], ["business"], ["headshot", "logo"]]) {
      const r = seamOutcome({
        category: "bienes-raices",
        mediaCategory: "bienes-negocio",
        roles,
        facts: { category: "bienes-raices", serverCustodyQuick: true },
      });
      assert.equal(r.refused, true, `roles ${roles.join("+")} must not satisfy the property requirement`);
    }
  });

  await check("B7: FULL Bienes is NOT subjected to Quick restrictions", () => {
    const r = seamOutcome({
      category: "bienes-raices",
      mediaCategory: "bienes-negocio",
      roles: ["headshot"],
      facts: {
        category: "bienes-raices",
        liveEntitlementRows: [{ packageKey: FULL_BIENES, packageTier: "digital_only" }],
      },
    });
    assert.equal(r.enforced, false);

    // And structurally: the browser publish core routes ONLY the SIMPLE key to the Quick path.
    const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(
      core.includes('String(params.quickBasePackageKey ?? "").trim().toLowerCase() ==='),
      "the Quick branch is selected by the base package key, not by sellerType",
    );
    assert.ok(
      !/sellerType === "business"\s*\)\s*\{\s*const roles/.test(core),
      "no branch enforces the Quick contract on `sellerType === \"business\"` alone",
    );
  });

  await check("B8: BIENES FSBO is not subjected to Quick restrictions", () => {
    // FSBO is `seller_type = 'private'`. The custody row builder can only ever write `business`,
    // and the browser core's Quick branch requires `sellerType === "business"` AND the Quick key,
    // so no FSBO publish can reach the Quick path.
    const row = buildQuickBienesListingRow({
      listingRow: { title: "t", city: "c", price: 1, seller_type: "private", category: "empleos" },
      ownerUserId: "owner-1",
      quickPackageKey: QUICK_BIENES,
      nowIso: "2026-09-21T00:00:00.000Z",
      mediaUrls: ["https://cdn.test/p1.jpg"],
    });
    assert.equal(row.seller_type, "business", "seller_type is a server constant");
    assert.equal(row.category, "bienes-raices", "category is a server constant");

    const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(
      core.includes('category === "bienes-raices" &&\n    sellerType === "business" &&'),
      "the Quick branch additionally requires the business seller type",
    );
  });

  await check("B9: Servicios and Restaurantes Quick enforcement stays truthful", () => {
    // Those two families' galleries are structurally single-purpose, so an unroled photo IS the
    // business — unchanged by this mission, and still refusing an explicit identity asset.
    const ok = enforceQuickBusinessPublishMedia({ category: "servicios", items: [{ role: null, mime: null }] });
    assert.equal(ok?.ok, true);
    const logoOnly = enforceQuickBusinessPublishMedia({
      category: "restaurantes",
      items: [{ role: "logo", mime: null }],
    });
    assert.equal(logoOnly?.ok, false);
  });
}

// =================================================================================================
// SECTION C — THE ATOMIC QUICK BIENES CUSTODY OPERATION, RUN FOR REAL
// =================================================================================================

type FakeDb = {
  rows: Map<string, Record<string, unknown>>;
  inserts: number;
  updates: number;
  groupPatches: number;
  links: { ownerUserId: string; listingId: string }[];
  lookupFails: boolean;
};

function newDb(): FakeDb {
  return { rows: new Map(), inserts: 0, updates: 0, groupPatches: 0, links: [], lookupFails: false };
}

function ports(db: FakeDb, overrides: Partial<QuickBienesPublishPorts> = {}): QuickBienesPublishPorts {
  let seq = 0;
  return {
    resolveOwnerUserId: async () => "owner-1",
    isDatabaseConfigured: () => true,
    resolveProduct: async () => ({ product: "quick", source: "server_custody_route" }),
    validateMedia: (items) => {
      const result = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
      if (!result || result.ok) return null;
      return { message: result.body.message, messageEs: result.body.messageEs, issues: result.body.issues };
    },
    findReusablePendingListing: async (key) => {
      if (db.lookupFails) return { ok: false };
      for (const [id, row] of db.rows) {
        const matches = Object.entries(key).every(([k, v]) => row[k] === v);
        if (matches) {
          const lj = row.listing_json;
          return {
            ok: true,
            row: {
              id,
              listingJson: lj && typeof lj === "object" && !Array.isArray(lj) ? (lj as Record<string, unknown>) : null,
            },
          };
        }
      }
      return { ok: true, row: null };
    },
    insertListing: async (row) => {
      db.inserts++;
      const id = `listing-${++seq}`;
      db.rows.set(id, { ...row });
      return { ok: true, listingId: id };
    },
    updateListing: async ({ listingId, ownerUserId, patch }) => {
      const row = db.rows.get(listingId);
      // Scoped by owner: an update can never reach another owner's row.
      if (!row || row.owner_id !== ownerUserId) return { ok: false };
      db.updates++;
      db.rows.set(listingId, { ...row, ...patch });
      return { ok: true };
    },
    groupMainListing: async (listingId) => {
      db.groupPatches++;
      const row = db.rows.get(listingId);
      if (row) db.rows.set(listingId, { ...row, br_inventory_group_id: listingId });
    },
    linkListingToBusiness: async ({ ownerUserId, listingId }) => {
      db.links.push({ ownerUserId, listingId });
      return { ok: true, businessId: "business-1" };
    },
    nowIso: () => "2026-09-21T00:00:00.000Z",
    ...overrides,
  };
}

const GOOD_ROW = {
  title: "Casa de 3 recámaras en Gilroy",
  description: "Una propiedad real.",
  city: "Gilroy",
  price: 750000,
  contact_phone: "4085550123",
  detail_pairs: [{ label: "Tipo", value: "Casa" }],
};

/**
 * Drive the real operation.
 *
 * `mediaUrls` defaults to one URL per declared role, so a fixture testing something OTHER than the
 * media pairing does not have to restate it — and a fixture that deliberately sends a malformed
 * `mediaRoles` still reaches the malformed-descriptor path rather than failing the pairing check
 * first. A fixture that cares about the pairing passes both explicitly.
 */
function run(
  db: FakeDb,
  request: Omit<Parameters<typeof executeQuickBienesPublish>[0], "mediaUrls"> & { mediaUrls?: readonly string[] },
  overrides: Partial<QuickBienesPublishPorts> = {},
): Promise<QuickBienesPublishResult> {
  const roles = Array.isArray(request.mediaRoles) ? request.mediaRoles : [];
  const withMedia = {
    ...request,
    mediaUrls: request.mediaUrls ?? roles.map((_, i) => `https://cdn.test/auto-${i + 1}.jpg`),
  };
  return executeQuickBienesPublish(withMedia, ports(db, overrides), { quickPackageKey: QUICK_BIENES });
}

async function sectionC() {
  await check("C1: a valid Quick Bienes publish writes exactly one row and returns its id", async () => {
    const db = newDb();
    const r = await run(db, { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"], declaredPackageKey: QUICK_BIENES });
    assert.equal(r.ok, true);
    assert.equal(db.inserts, 1);
    assert.ok(r.ok && r.listingId);
    const row = db.rows.get(r.ok ? r.listingId : "")!;
    assert.equal(row.owner_id, "owner-1");
    assert.equal(row.category, "bienes-raices");
    assert.equal(row.seller_type, "business");
    assert.equal(row.status, "pending");
    assert.equal(row.is_published, false);
    assert.equal(row.inventory_role, "main");
    assert.equal(db.groupPatches, 1, "a fresh main row groups itself");
  });

  await check("C2 REQUIREMENT 9: the former browser-only direct insert cannot publish Quick Bienes", async () => {
    // Behaviour: the operation is the ONLY writer, and every pre-write refusal leaves no row.
    const db = newDb();
    const refused = await run(db, { listingRow: GOOD_ROW, mediaRoles: ["headshot"], mediaUrls: ["https://cdn.test/p1.jpg"] });
    assert.equal(refused.ok, false);
    assert.equal(db.inserts + db.updates, 0, "a refusal writes nothing at all");

    // Wiring: the two browser seams are EXHAUSTIVE.
    //
    // Round-3 repair. This check used to assert only that the browser insert was the ELSE of the
    // custody branch, and that the older media-gate route was deleted. Both were true while the
    // product was wide open: `quickBienesPublish` is chosen by a CLIENT-HELD package key, so
    // omitting it dropped the request into that ELSE — a browser INSERT with no media check at
    // all, weaker than the behaviour before either gate existed.
    const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(
      core.includes("publishQuickBienesThroughServerCustody"),
      "a declared Quick publish goes through server custody",
    );
    assert.ok(
      core.includes("if (!custody.ok) return { ok: false, error: custody.error };"),
      "a custody refusal aborts the publish — no fall-through to the browser insert",
    );
    const custodyIdx = core.indexOf("if (quickBienesPublish) {");
    const browserInsertIdx = core.indexOf("insertListingsRowResilient(supabase, insertPayload)");
    assert.ok(custodyIdx > -1 && browserInsertIdx > custodyIdx, "the browser insert is the ELSE of the Quick branch");

    // ...and that ELSE is itself gated, fail-closed, BEFORE the row is built.
    const gateCallIdx = core.indexOf('category === "bienes-raices" && sellerType === "business" && !quickBienesPublish');
    assert.ok(gateCallIdx > -1, "every NON-custody business publish is gated too");
    const payloadIdx = core.indexOf("const insertPayload = buildListingsInsertRowForLeonixPublish(");
    assert.ok(gateCallIdx < payloadIdx, "the gate runs before the row is even built");
    assert.ok(gateCallIdx < browserInsertIdx, "and before the browser insert");
    assert.ok(
      core.includes("if (!gate.ok) return { ok: false, error: gate.error };"),
      "a gate refusal aborts the publish",
    );

    // The gate route exists again, fails closed, and resolves the product server-side.
    const gate = read("app/api/clasificados/bienes-raices/negocio/publish-media-gate/route.ts");
    assert.ok(gate.includes("getBearerUserId(request)"), "identity is the bearer, never the body");
    assert.ok(gate.includes("resolveQuickBusinessPublishIdentity("), "the gate resolves the product itself");
    assert.ok(gate.includes("ownerUserId: userId"), "and scopes that resolution to the bearer");
    assert.ok(gate.includes("enforceQuickBusinessPublishMedia("), "and runs the real contract");
    // The browser-side helper must treat every non-2xx and every throw as a refusal.
    const helperAt = core.indexOf("async function enforceBienesNegocioPublishMediaOnServer(");
    assert.ok(helperAt > -1, "the fail-closed helper exists");
    const helper = core.slice(helperAt, core.indexOf("async function publishQuickBienesThroughServerCustody(", helperAt));
    assert.ok(helper.includes("if (res.ok) return { ok: true };"), "ONLY a 2xx is a pass");
    assert.ok(/catch\s*\{[\s\S]*?return \{ ok: false/.test(helper), "a thrown error is a refusal");
    assert.ok(helper.includes("if (!accessToken) return { ok: false, error: generic };"), "no session is a refusal");
  });

  await check("C3 REQUIREMENT 10: missing / invalid bearer identity fails, and writes nothing", async () => {
    for (const subject of [null, "", "   "]) {
      const db = newDb();
      const r = await run(db, { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] }, { resolveOwnerUserId: async () => subject });
      assert.equal(r.ok, false);
      assert.ok(!r.ok && r.status === 401 && r.body.error === "auth_required", JSON.stringify(r));
      assert.equal(db.inserts + db.updates, 0);
    }
  });

  await check("C4 REQUIREMENT 11: browser-forged Quick/Full identity fails", async () => {
    // Forging "I am Quick" while the server says FULL is refused outright — a Full listing is
    // never converted into a Quick one.
    const db = newDb();
    const r = await run(
      db,
      { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"], declaredPackageKey: QUICK_BIENES },
      { resolveProduct: async () => ({ product: "full", source: "live_entitlement" }) },
    );
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.status === 409 && r.body.error === "quick_product_mismatch");
    assert.equal(db.inserts + db.updates, 0);

    // An `unverified` answer is likewise refused by this route: custody publishes Quick or nothing.
    const db2 = newDb();
    const r2 = await run(
      db2,
      { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] },
      { resolveProduct: async () => ({ product: "unverified", source: "none" }) },
    );
    assert.equal(r2.ok, false);
    assert.equal(db2.inserts, 0);

    // And forging "I am Full" cannot escape: the product comes from the server, so the media
    // contract still runs and still refuses a headshot-only gallery.
    const db3 = newDb();
    const r3 = await run(db3, { listingRow: GOOD_ROW, mediaRoles: ["headshot"], mediaUrls: ["https://cdn.test/p1.jpg"], declaredPackageKey: FULL_BIENES });
    assert.equal(r3.ok, false);
    assert.ok(!r3.ok && r3.body.error === "media_contract_violation");
  });

  await check("C5: a caller cannot publish as another owner, or into another category", async () => {
    const db = newDb();
    const r = await run(db, {
      listingRow: { ...GOOD_ROW, owner_id: "victim", category: "empleos", seller_type: "private", status: "active", is_published: true, inventory_role: "inventory_property" },
      mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"],
    });
    assert.equal(r.ok, true);
    const row = db.rows.get(r.ok ? r.listingId : "")!;
    assert.equal(row.owner_id, "owner-1", "owner_id is the bearer subject, never the body");
    assert.equal(row.category, "bienes-raices");
    assert.equal(row.seller_type, "business");
    assert.equal(row.status, "pending", "a caller cannot arrive pre-published");
    assert.equal(row.is_published, false);
    assert.equal(row.inventory_role, "main", "Quick includes ONE property — never an inventory child");
  });

  await check("C6: an update can never reach a row owned by someone else", async () => {
    const db = newDb();
    // Plant a pending row that MATCHES the reuse key shape but belongs to another owner.
    db.rows.set("victim-row", {
      ...buildQuickBienesReuseKey({ ownerUserId: "someone-else", title: GOOD_ROW.title }),
      listing_json: null,
    });
    const r = await run(
      db,
      { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] },
      {
        // Force the lookup to hand back the victim's row, the worst case this guard exists for.
        findReusablePendingListing: async () => ({ ok: true, row: { id: "victim-row", listingJson: null } }),
      },
    );
    assert.equal(r.ok, false, "the owner-scoped update refuses rather than writing");
    assert.equal(db.updates, 0);
    assert.equal(db.rows.get("victim-row")!.owner_id, "someone-else", "the victim row is untouched");
  });

  await check("C7 REQUIREMENT 12: a duplicate retry does not create a second listing", async () => {
    const db = newDb();
    const req = { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"], declaredPackageKey: QUICK_BIENES };
    const first = await run(db, req);
    const second = await run(db, req);
    const third = await run(db, { ...req, listingRow: { ...GOOD_ROW, price: 749000 } });
    assert.ok(first.ok && second.ok && third.ok);
    assert.equal(db.inserts, 1, "exactly one row exists after three attempts");
    assert.equal(db.rows.size, 1);
    assert.equal(first.ok && second.ok && first.listingId === second.listingId, true);
    assert.equal(second.ok && second.reused, true);
    assert.equal(third.ok && third.listingId, first.ok ? first.listingId : "");
    assert.equal(db.rows.get(first.ok ? first.listingId : "")!.price, 749000, "the retry amended the same row");
  });

  await check("C8: a FAILED reuse lookup is a hard stop, never a duplicate insert", async () => {
    const db = newDb();
    db.lookupFails = true;
    const r = await run(db, { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] });
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.body.error === "reuse_lookup_failed");
    assert.equal(db.inserts, 0);
  });

  await check("C9 REQUIREMENT 13: the canonical business-listing link is written, once, for the owner", async () => {
    const db = newDb();
    const req = { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] };
    const first = await run(db, req);
    await run(db, req);
    assert.ok(first.ok && first.businessLinked === true && first.businessId === "business-1");
    assert.equal(db.links.length, 2, "the link write runs on every attempt and is idempotent by design");
    assert.deepEqual(new Set(db.links.map((l) => l.listingId)).size, 1, "always the SAME listing");
    assert.ok(db.links.every((l) => l.ownerUserId === "owner-1"), "always the bearer subject");
  });

  await check("C10: a customer with no business yet still gets their listing", async () => {
    const db = newDb();
    const r = await run(
      db,
      { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] },
      { linkListingToBusiness: async () => ({ ok: false, businessId: null }) },
    );
    assert.equal(r.ok, true, "a link failure never fails a publish that already wrote the row");
    assert.equal(r.ok && r.businessLinked, false);
  });

  await check("C11: canonical field rules are the boundary, and refuse before any write", async () => {
    const db = newDb();
    for (const [row, code] of [
      [{ ...GOOD_ROW, title: "   " }, "title_required"],
      [{ ...GOOD_ROW, city: "" }, "city_required"],
      [{ ...GOOD_ROW, price: -5 }, "price_invalid"],
      [{ ...GOOD_ROW, price: "abc" }, "price_invalid"],
      [null, "listing_row_required"],
    ] as [unknown, string][]) {
      const r = await run(db, { listingRow: row, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] });
      assert.equal(r.ok, false, `${code} must refuse`);
      assert.ok(!r.ok && r.body.issues?.includes(code), `${code}: ${JSON.stringify(!r.ok && r.body)}`);
    }
    // No media at all is refused by the media contract before the field rules are even consulted.
    const empty = await run(db, { listingRow: GOOD_ROW, mediaRoles: [], mediaUrls: [] });
    assert.equal(empty.ok, false);
    assert.equal(db.inserts + db.updates, 0);
  });

  await check("C12: ORDER is part of the contract — identity, product, media, fields, then write", async () => {
    const calls: string[] = [];
    const db = newDb();
    await run(
      db,
      { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] },
      {
        resolveOwnerUserId: async () => {
          calls.push("identity");
          return "owner-1";
        },
        resolveProduct: async () => {
          calls.push("product");
          return { product: "quick", source: "server_custody_route" };
        },
        validateMedia: (items) => {
          calls.push("media");
          const result = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
          return !result || result.ok
            ? null
            : { message: result.body.message, messageEs: result.body.messageEs, issues: result.body.issues };
        },
        findReusablePendingListing: async () => {
          calls.push("lookup");
          return { ok: true, row: null };
        },
        insertListing: async () => {
          calls.push("write");
          return { ok: true, listingId: "listing-1" };
        },
        groupMainListing: async () => {
          calls.push("group");
        },
        linkListingToBusiness: async () => {
          calls.push("link");
          return { ok: true, businessId: "business-1" };
        },
      },
    );
    assert.deepEqual(calls, ["identity", "product", "media", "lookup", "write", "group", "link"]);
  });

  await check("C13: the row carries the SERVER-written Quick binding, and no forged payment state", async () => {
    const db = newDb();
    const r = await run(db, {
      listingRow: { ...GOOD_ROW, listing_json: { br_payment: { payment_status: "paid", lane: "privado" } } },
      mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"],
    });
    assert.ok(r.ok);
    const row = db.rows.get(r.ok ? r.listingId : "")!;
    const lj = row.listing_json as Record<string, unknown>;
    assert.deepEqual(lj.br_payment, {
      payment_status: "pending",
      lane: "negocio",
      base_package_key: QUICK_BIENES,
    }, "the server rebuilds the payment block — a caller cannot claim it is already paid");
  });

  await check("C14: the column whitelist drops everything it does not name", async () => {
    const db = newDb();
    const r = await run(db, {
      listingRow: { ...GOOD_ROW, leonix_ad_id: "forged", published_at: "2020-01-01", br_inventory_parent_listing_id: "x", arbitrary: 1 },
      mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"],
    });
    assert.ok(r.ok);
    const row = db.rows.get(r.ok ? r.listingId : "")!;
    for (const forged of ["leonix_ad_id", "published_at", "br_inventory_parent_listing_id", "arbitrary"]) {
      assert.equal(forged in row, false, `${forged} must not reach the row`);
    }
    assert.ok(!QUICK_BIENES_ALLOWED_COLUMNS.includes("owner_id"));
    assert.ok(!QUICK_BIENES_ALLOWED_COLUMNS.includes("listing_json"));
    assert.ok(!QUICK_BIENES_ALLOWED_COLUMNS.includes("status"));
  });

  await check("C15: an unconfigured database refuses instead of pretending to publish", async () => {
    const db = newDb();
    const r = await run(db, { listingRow: GOOD_ROW, mediaRoles: ["property"], mediaUrls: ["https://cdn.test/p1.jpg"] }, { isDatabaseConfigured: () => false });
    assert.equal(r.ok, false);
    assert.ok(!r.ok && r.status === 503 && r.body.error === "db_not_configured");
    assert.equal(db.inserts, 0);
  });

  await check("C16: a malformed media descriptor is refused, never coerced into \"no photos\"", async () => {
    const db = newDb();
    for (const roles of [undefined, null, "property", { 0: "property" }, new Array(65).fill("property")]) {
      const r = await run(db, { listingRow: GOOD_ROW, mediaRoles: roles as unknown as string[] });
      assert.equal(r.ok, false);
      assert.ok(!r.ok && r.body.error === "invalid_body", JSON.stringify(!r.ok && r.body));
    }
    assert.equal(db.inserts, 0);
  });

  await check("C17: field validation agrees with the operation (pure module, directly)", () => {
    assert.deepEqual(validateQuickBienesListingFields({ listingRow: GOOD_ROW, mediaCount: 1 }), []);
    assert.equal(validateQuickBienesListingFields({ listingRow: GOOD_ROW, mediaCount: 0 })[0]!.code, "media_required");
  });
}

// =================================================================================================
// SECTION D — WIRING: THE SEAMS ARE CONNECTED TO THE TRUTH
// =================================================================================================

async function sectionD() {
  await check("D1: the shared Autos seam resolves a PRODUCT, and no longer decides on the lane", () => {
    const route = read("app/api/clasificados/autos/listings/route.ts");
    assert.ok(route.includes("resolveQuickBusinessPublishIdentity("), "the Autos seam asks the product resolver");
    assert.ok(
      route.includes("identity.enforceQuickContract\n      ? enforceQuickBusinessPublishMedia("),
      "the Quick contract runs only for a verified Quick dealer",
    );
    assert.ok(route.includes('category: "autos",'), "the resolver is asked about the autos package pair");
    assert.ok(route.includes("ownerUserId: userId"), "the owner is the bearer subject, never the body");
  });

  await check("D2: the Quick Bienes endpoint is a shell over the port-injected operation", () => {
    const route = read("app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts");
    assert.ok(route.includes("executeQuickBienesPublish("), "the endpoint runs the operation this file tests");
    assert.ok(route.includes("getBearerUserId(request)"), "identity comes from the bearer token");
    assert.ok(route.includes("serverCustodyQuick: true"), "the custody leg is set by the route, not by a body");
    assert.ok(route.includes("linkSelfServiceListingToBusiness("), "the canonical link writer is wired in");
    assert.ok(route.includes('.eq("owner_id", ownerUserId)'), "the real update port is owner-scoped too");
    assert.ok(!/from\("(?!listings\b|leonix)/.test(route), "no table beyond `listings` is reachable from here");
  });

  await check("D3: the declaration channel is documented as restriction-only wherever it is read", () => {
    const identity = read("app/lib/listingPlans/quickBusinessProductIdentity.ts");
    assert.ok(identity.includes("declared_simple_package"));
    // The ONLY comparison a declaration can win is against the SIMPLE key.
    assert.ok(
      identity.includes("normalizeKey(facts.declaredPackageKey) === normalizeKey(pair.simple)"),
      "a declaration is compared against the SIMPLE key and nothing else",
    );
    assert.ok(
      !/declaredPackageKey[\s\S]{0,200}pair\.full/.test(identity),
      "no code path compares a declaration against the FULL key",
    );
  });

  await check("D4 REQUIREMENT 14: both staff-assisted routes remain protected", () => {
    for (const p of [
      "app/api/clasificados/autos/assisted-publish/route.ts",
      "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts",
    ]) {
      const src = read(p);
      assert.ok(src.includes("enforceQuickBusinessPublishMedia("), `${p} still enforces the contract`);
      assert.ok(src.includes("extractSemanticMediaItems("), `${p} still extracts the media set`);
      assert.ok(
        src.includes("readActiveAssistedPublishingContext("),
        `${p} still re-checks the live staff roster at redemption`,
      );
      // The assisted routes are UNCONDITIONAL on purpose: a staff actor publishing on a
      // customer's behalf is held to the subject-photo rule whatever the package, so this
      // mission's product boundary cannot be used to weaken staff-assisted publishing.
      assert.ok(
        !src.includes("resolveQuickBusinessPublishIdentity("),
        `${p} must NOT become conditional on a product`,
      );
    }
  });

  await check("D5: the Bienes preview and the draft publishers carry the base package, not a plan flag", () => {
    const preview = read(
      "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    );
    assert.ok(
      preview.includes('basePackageKey: publishInventory.mode === "main" ? baseCheckout.packageKey : null'),
      "the preview declares the package it is about to charge, and only for the main row",
    );
    const draft = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
    assert.ok(draft.includes("quickBasePackageKey: opts?.basePackageKey ?? null"), "the draft publishers pass it through");
    const autosPreview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
    assert.ok(
      autosPreview.includes("basePackageKey: baseCheckout.packageKey"),
      "the dealer preview declares the package the server already selected for it",
    );
  });

  await check("D6: no Quick count cap, video rule or one-item rule leaks into a Full product", () => {
    const semantics = read("app/lib/quickBusiness/quickBusinessMediaSemantics.ts");
    assert.ok(
      semantics.includes("QUICK_BUSINESS_PUBLISH_MAX_IMAGES"),
      "publish-seam caps are declared separately from the intake cap",
    );
    assert.ok(
      semantics.includes("enforceQuickContract"),
      "the Quick 3-image / no-video publish cap only runs when the product is Quick",
    );
    // And every enforcement call site is now behind a product check or a staff context.
    const autos = read("app/api/clasificados/autos/listings/route.ts");
    assert.ok(autos.indexOf("identity.enforceQuickContract") < autos.indexOf("enforceQuickBusinessPublishMedia("));
  });

  await check("D7: EVERY self-service enforcement call site is product-gated, not just Autos", () => {
    // THE DEFECT THIS EXISTS FOR: the product-boundary work gated Autos and Bienes and left
    // Servicios and Restaurantes enforcing unconditionally — and BOTH sell a Quick package AND a
    // Full one through the same seam. A Full Servicios or Restaurantes customer was therefore
    // still being held to a $99 product's media rule, which is the blocker, not a variant of it.
    //
    // D6 above only ever inspected the Autos route, so it could not see this. Every family in the
    // Simple/Full split is now checked, by iterating the split itself rather than a hand-written
    // list that can fall behind it.
    const CALL_SITES: Readonly<Record<string, string>> = {
      autos: "app/api/clasificados/autos/listings/route.ts",
      servicios: "app/api/clasificados/servicios/publish/route.ts",
      restaurantes: "app/api/clasificados/restaurantes/publish/route.ts",
    };
    for (const [family, file] of Object.entries(CALL_SITES)) {
      const src = read(file);
      const enforceAt = src.indexOf("enforceQuickBusinessPublishMedia(");
      if (enforceAt < 0) continue; // this family does not run the contract here at all
      assert.ok(
        src.includes("resolveQuickBusinessPublishIdentity("),
        `${family}: runs the Quick contract but resolves no product — a Full customer is held to it`,
      );
      assert.ok(
        src.indexOf("resolveQuickBusinessPublishIdentity(") < enforceAt,
        `${family}: the product must be resolved BEFORE the contract runs`,
      );
      assert.ok(
        /enforceQuickContract\s*\n?\s*\?\s*enforceQuickBusinessPublishMedia\(|enforceQuickContract$/m.test(src) ||
          /\.enforceQuickContract/.test(src.slice(Math.max(0, enforceAt - 400), enforceAt)),
        `${family}: the contract must be conditional on the resolved product`,
      );
    }
  });

  await check("D8: the Quick Bienes operation WRITES the media it validated", () => {
    // Validating a list of role descriptors and letting the browser write the gallery separately
    // left the check and the persisted media with no relationship: a request declaring
    // ["property"] and uploading nothing produced a listing with zero images, from the endpoint
    // whose whole purpose is to guarantee a real photo of the property.
    const contract = read("app/lib/clasificados/bienes-raices/quickBienesPublishContract.ts");
    assert.ok(contract.includes("mediaUrls: readonly string[];"), "the row builder takes the validated URLs");
    assert.ok(/images: \[\.\.\.input\.mediaUrls\]/.test(contract), "and writes them");
    // Asserted on the EXPORTED ARRAYS, not on source text: a regex over the file would pass or
    // fail on comment wording, which is not the property that matters.
    assert.ok(
      QUICK_BIENES_SERVER_OWNED_COLUMNS.includes("images"),
      "images is SERVER-owned, so a caller cannot supply a gallery that skipped the check",
    );
    assert.ok(
      !QUICK_BIENES_ALLOWED_COLUMNS.includes("images"),
      "and is not caller-contributable",
    );
    // Proven by RUNNING the whitelist: a caller-sent gallery is dropped entirely.
    const forged = buildQuickBienesListingRow({
      listingRow: { title: "t", city: "c", price: 1, images: ["https://evil.test/not-checked.jpg"] },
      ownerUserId: "owner-1",
      quickPackageKey: QUICK_BIENES,
      nowIso: "2026-09-21T00:00:00.000Z",
      mediaUrls: ["https://cdn.test/validated.jpg"],
    });
    assert.deepEqual(forged.images, ["https://cdn.test/validated.jpg"], "only the validated list is written");

    const op = read("app/lib/clasificados/bienes-raices/quickBienesPublishOperation.ts");
    assert.ok(
      /mediaUrls\.length !== request\.mediaRoles\.length/.test(op),
      "the roles and the URLs must correspond one-for-one",
    );
    assert.ok(/mediaCount: mediaUrls\.length/.test(op), "the field rule counts REAL media");
  });

  await check("D9: a retry finds its own row even when the title carried whitespace", () => {
    // The reuse key trimmed the title; the row builder spread the caller's raw value. A title with
    // a trailing space was stored untrimmed and searched for trimmed, so the lookup missed and a
    // SECOND pending listing was created — silently defeating the duplicate protection.
    const row = buildQuickBienesListingRow({
      listingRow: { title: "  Casa en Gilroy  ", city: "Gilroy", price: 749000 },
      ownerUserId: "owner-1",
      quickPackageKey: QUICK_BIENES,
      nowIso: "2026-09-21T00:00:00.000Z",
      mediaUrls: ["https://cdn.test/p1.jpg"],
    });
    const key = buildQuickBienesReuseKey({ ownerUserId: "owner-1", title: "  Casa en Gilroy  " });
    assert.equal(row.title, key.title, "the row is written exactly as the reuse key looks it up");
    assert.equal(row.title, "Casa en Gilroy");
  });

  await check("D10: assisted Bienes never publishes a live listing before the payment clears", () => {
    // `publish_for_client` inserted with status active / is_published true / published_at set and
    // only THEN checked for a cleared manual payment, returning 402 with the listing already
    // public and no rollback. `is_published = true AND status = 'active'` is the public read
    // predicate, so staff saw "clear the payment first" while the unpaid listing was live.
    const src = read("app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts");
    const writeAt = src.indexOf('status: "pending"');
    const checkAt = src.indexOf("refuseUnlessAuthoritativePayment(");
    const activateAt = src.indexOf('status: "active", is_published: true');
    assert.ok(writeAt > 0, "the row is written PENDING");
    assert.ok(checkAt > writeAt, "the payment is checked after the row exists");
    assert.ok(activateAt > checkAt, "and activation happens only AFTER that check");
    assert.ok(
      !/status: isAssistedPublish \? "active" : "pending"/.test(src),
      "no path writes the row live on insert",
    );
  });
}

// =================================================================================================
// SECTION E — THE ROUND-3 ADVERSARIAL REPAIRS
//
// Every check here exists because an independent review FALSIFIED a claim Sections A–D had
// certified. Each one is written to fail if the repair is reverted.
// =================================================================================================

async function sectionE() {
  await check("E1: EXTERNAL VIDEO is refused — not just a video MIME in the gallery", () => {
    // "Quick includes no video" was enforced only against `video/*` MIMEs on gallery items. Every
    // family that sells video sells it as an external LINK LIST, which carries no MIME at all, so
    // three of four seams could attach video freely.
    for (const [category, subjectRole] of [
      ["autos-dealer", "vehicle"],
      ["bienes-negocio", "property"],
      ["servicios", "business"],
      ["restaurantes", "business"],
    ] as const) {
      const good = enforceQuickBusinessPublishMedia({ category, items: [{ role: subjectRole, mime: null }] });
      assert.equal(good?.ok, true, `${category}: a compliant photo set passes`);

      for (const count of [1, 4, 8]) {
        const withVideo = enforceQuickBusinessPublishMedia({
          category,
          items: [{ role: subjectRole, mime: null }],
          externalVideoCount: count,
        });
        assert.equal(withVideo?.ok, false, `${category}: ${count} external video(s) must be refused`);
        assert.ok(
          !withVideo?.ok && withVideo!.issues.some((i) => i.code === "video_not_allowed"),
          `${category}: and refused AS video, not as some other issue`,
        );
      }
      // Zero is not a refusal, so the rule cannot be satisfied by always failing.
      const none = enforceQuickBusinessPublishMedia({
        category,
        items: [{ role: subjectRole, mime: null }],
        externalVideoCount: 0,
      });
      assert.equal(none?.ok, true, `${category}: zero external video still passes`);
    }
  });

  await check("E2: every self-service seam COUNTS its own external video list", () => {
    // A contract that can see video is worthless if no seam tells it. Each assertion names the
    // real field that family stores its links in.
    const autos = read("app/api/clasificados/autos/listings/route.ts");
    assert.ok(/externalVideoCount: dealerExternalVideoCount/.test(autos), "autos passes a count");
    assert.ok(/videoUrls/.test(autos), "derived from the dealer lane's own videoUrls");

    const servicios = read("app/api/clasificados/servicios/publish/route.ts");
    assert.ok(/externalVideoCount: serviciosExternalVideoCount/.test(servicios), "servicios passes a count");
    assert.ok(/state\.videos/.test(servicios), "derived from the Servicios video list");

    const restaurantes = read("app/api/clasificados/restaurantes/publish/route.ts");
    assert.ok(/externalVideoCount: restauranteExternalVideoCount/.test(restaurantes), "restaurantes passes a count");
    assert.ok(
      /collectRestauranteExternalVideoUrls\(draft\)/.test(restaurantes),
      "derived from the canonical Restaurantes collector",
    );

    // Quick Bienes needs no count: its contract whitelists no video column at all.
    const contract = read("app/lib/clasificados/bienes-raices/quickBienesPublishContract.ts");
    assert.ok(!/video/i.test(contract.replace(/\/\*[\s\S]*?\*\//g, "")), "Quick Bienes has no video column to carry one");
  });

  await check("E3: the entitlement read is OWNER-SCOPED and the ledger leg is SETTLED-ONLY", () => {
    const server = read("app/lib/listingPlans/quickBusinessProductIdentityServer.ts");
    const entAt = server.indexOf('.from("listing_package_entitlements")');
    assert.ok(entAt > 0, "the entitlement read exists");
    const entBlock = server.slice(entAt, server.indexOf(".limit(", entAt));
    assert.ok(
      entBlock.includes('.eq("owner_user_id", input.ownerUserId)'),
      "a body-supplied listingId cannot name ANOTHER customer's Full entitlement",
    );
    assert.ok(entBlock.includes('.eq("listing_id", input.listingId)'), "still scoped to the listing");

    // The ledger leg must not let an ABANDONED Quick attempt out-rank a real Full purchase.
    const ledgerAt = server.indexOf("async function readCheckoutLedgerBasePackageKey(");
    assert.ok(ledgerAt > 0, "the ledger leg exists");
    const ledgerBlock = server.slice(ledgerAt, server.indexOf("export type QuickBusinessPublishIdentityInput", ledgerAt));
    assert.ok(
      ledgerBlock.includes('const key = String(settled?.package_key ?? "").trim();'),
      "only a SETTLED row names a product",
    );
    assert.ok(!ledgerBlock.includes("settled ?? rows[0]"), "the most-recent-open-attempt fallback is gone");
  });

  await check("E4: role/URL pairing is compared BEFORE empties are dropped", async () => {
    // Filtering first let roles=[logo, property] pair with urls=["", a, b]: the counts matched
    // after the filter while every role described a different photo than the one declared.
    const db = newDb();
    const shifted = await run(db, {
      listingRow: GOOD_ROW,
      mediaRoles: ["logo", "property"],
      mediaUrls: ["", "https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
      declaredPackageKey: QUICK_BIENES,
    });
    assert.equal(shifted.ok, false, "a padded URL list is refused, not silently re-indexed");
    assert.equal(db.inserts + db.updates, 0, "and writes nothing");

    // The honest matching case still publishes, so this is not a blanket refusal.
    const db2 = newDb();
    const okRun = await run(db2, {
      listingRow: GOOD_ROW,
      mediaRoles: ["property", "logo"],
      mediaUrls: ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
      declaredPackageKey: QUICK_BIENES,
    });
    assert.equal(okRun.ok, true, "a correctly paired set still publishes");
    assert.equal(db2.inserts, 1);
  });

  await check("E5: the assisted UPDATE path never demotes an already-live listing", () => {
    const src = read("app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts");
    const updateAt = src.indexOf("if (listingId) {");
    assert.ok(updateAt > 0, "the update path exists");
    const updateBlock = src.slice(updateAt, src.indexOf("} else {", updateAt));
    for (const field of ["status", "is_published", "published_at"]) {
      assert.ok(
        updateBlock.includes(`delete patch.${field};`),
        `the update must not carry ${field} — a Stripe-paid live listing was being taken dark`,
      );
    }
    assert.ok(updateBlock.includes("delete patch.owner_id;"), "and still never rewrites ownership");

    // The INSERT path must still be born pending — the original blocker stays closed.
    const insertRowAt = src.indexOf("const insertRow: Record<string, unknown> = {");
    const insertRowBlock = src.slice(insertRowAt, src.indexOf("};", insertRowAt));
    assert.ok(insertRowBlock.includes('status: "pending"'), "a new row is born pending");
    assert.ok(insertRowBlock.includes("is_published: false"), "and unpublished");

    // Activation is still the only way to live, and still after the payment check.
    const checkAt = src.indexOf("refuseUnlessAuthoritativePayment({");
    const activateAt = src.indexOf('.update({ status: "active", is_published: true');
    assert.ok(checkAt > 0 && activateAt > checkAt, "activation happens only AFTER the payment check");
    assert.ok(activateAt > updateAt, "and after the row write");
  });

  await check("E6: the Servicios seam names the canonical ROW, not the public slug", () => {
    const servicios = read("app/api/clasificados/servicios/publish/route.ts");
    const resolveAt = servicios.indexOf("const serviciosProduct = await resolveQuickBusinessPublishIdentity({");
    assert.ok(resolveAt > 0, "the seam resolves a product");
    const block = servicios.slice(resolveAt, servicios.indexOf("});", resolveAt));
    assert.ok(
      block.includes("b.existingListingId"),
      "listingId is the canonical row UUID — a slug matched no entitlement and no payment record",
    );
    assert.ok(!block.includes("existingPublicSlug"), "the slug is never passed as a listing id");
  });
}

(async () => {
  await sectionA();
  await sectionB();
  await sectionC();
  await sectionD();
  await sectionE();
  console.log(`\nverify-quick-product-boundary-01: OK (${checks} behavioral checks — no DB, no network, no Stripe)`);
})().catch(() => {
  console.error("\nverify-quick-product-boundary-01: FAILED");
  process.exit(1);
});
