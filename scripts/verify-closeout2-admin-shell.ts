/**
 * CLOSEOUT 2 — ADMIN OPERATING SHELL NORMALIZATION (foundation + generic shell + Autos).
 *
 * Executable checks against the real pure modules and rendered components, plus narrow source guards
 * where behaviour lives in a server page / client table that cannot be mounted under raw tsx.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-closeout2-admin-shell.ts
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
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const CLAS = "app/admin/(dashboard)/workspace/clasificados";
const P = {
  header: `${CLAS}/_components/ClasificadosQueueHeader.tsx`,
  scopeNav: `${CLAS}/_components/ClasificadosScopeNav.tsx`,
  queuePage: `${CLAS}/_components/ListingsCategoryOpsQueuePage.tsx`,
  table: `${CLAS}/AdminListingsTable.tsx`,
  autos: `${CLAS}/autos/page.tsx`,
  sections: `${CLAS}/_components/normalized/AdminListingCardSections.tsx`,
  summary: `${CLAS}/_components/normalized/AdminCategorySummaryPanel.tsx`,
  filter: `${CLAS}/_components/normalized/AdminCategoryFilterBar.tsx`,
  shell: `${CLAS}/_lib/adminNormalizedShell.ts`,
  scopeUrls: `${CLAS}/_lib/clasificadosAdminScopeUrls.ts`,
  truthLib: "app/admin/_lib/adminListingCommercialTruth.ts",
  capacityLib: "app/admin/_lib/adminAutosDealerCapacity.ts",
};

// ── fake Supabase (read-only): records every call; any write verb would throw ────────────────────
type Call = { table: string; op: string; col?: string; ids?: unknown[] };
function fakeSupabase(
  tables: Record<string, { rows?: Record<string, unknown>[]; error?: string }>,
  calls: Call[],
  opts: { limitRows?: number } = {},
) {
  return {
    from(table: string) {
      const spec = tables[table] ?? { rows: [] };
      let filtered = spec.rows ?? [];
      const b: Record<string, unknown> = {
        select: () => b,
        eq(col: string, v: unknown) {
          filtered = filtered.filter((r) => r[col] === v);
          return b;
        },
        is(col: string, v: unknown) {
          filtered = filtered.filter((r) => (r[col] ?? null) === v);
          return b;
        },
        or: () => b,
        in(col: string, ids: unknown[]) {
          calls.push({ table, op: "in", col, ids });
          filtered = filtered.filter((r) => ids.includes(r[col]));
          return b;
        },
        order: () => b,
        limit: () => b,
        then(onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) {
          const out = spec.error
            ? { data: null, error: { message: spec.error } }
            : { data: opts.limitRows ? filtered.slice(0, opts.limitRows) : filtered, error: null };
          return Promise.resolve(out).then(onF, onR);
        },
      };
      return b;
    },
  } as never;
}

const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

async function main() {
  const truthLib = await import("../app/admin/_lib/adminListingCommercialTruth");
  const shell = await import("../app/admin/(dashboard)/workspace/clasificados/_lib/adminNormalizedShell");
  const scopeUrls = await import("../app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosAdminScopeUrls");
  const capLib = await import("../app/admin/_lib/adminAutosDealerCapacity");
  const summaryLib = await import("../app/admin/_lib/adminCategorySummary");
  const okTruth = (activeByGroupKey: Record<string, number>) => ({
    ok: true,
    error: null,
    standardLimit: 10,
    boostedLimit: 20,
    groups: [],
    activeByGroupKey,
    totalActiveDealerRows: Object.values(activeByGroupKey).reduce((a, b) => a + b, 0),
    capped: false,
    note: "",
  });
  const strings = await import("../app/admin/_lib/adminStrings");
  const header = await import("../app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader");
  const flow = await import("../app/admin/_lib/adminQueueActionFlow");
  const policy = await import("../app/lib/clasificados/autos/autosDealerInventoryPolicy");
  const { derivePaymentCircuit } = await import("../app/admin/_lib/paymentCircuit");
  void derivePaymentCircuit;

  const payment = (over: Partial<import("../app/admin/_lib/adminListingCommercialTruth").CommercialPaymentRow> = {}) => ({
    id: "pay-1",
    listing_id: UUID(1),
    package_key: "rentas_business_monthly",
    package_tier: null,
    package_entitlement_id: "ent-1",
    payment_status: "paid",
    source: "stripe_checkout",
    billing_mode: "one_time",
    stripe_checkout_session_id: "cs_test_1",
    stripe_subscription_id: null,
    amount_paid_cents: 4900,
    amount_total_cents: 4900,
    paid_at: "2026-09-10T00:00:00Z",
    created_at: "2026-09-10T00:00:00Z",
    ...over,
  });
  const ent = (over: Partial<import("../app/admin/_lib/adminListingCommercialTruth").CommercialEntitlementRow> = {}) => ({
    id: "ent-1",
    listing_id: UUID(1),
    status: "active",
    package_tier: null,
    ends_at: "2026-10-10T00:00:00Z",
    revoked_at: null,
    created_at: "2026-09-10T00:00:00Z",
    ...over,
  });
  const allReadable = { payments: false, entitlements: false, subscriptions: false };
  const PUBLIC_LISTING = { semantic: "PUBLIC" as const, reason: "Live: active and published.", rawStatus: "active", source: "listings" as const };

  // ═══ COMMERCIAL TRUTH — pure derivation ════════════════════════════════════════════════════════
  await check("commercial truth: paid + active entitlement + public listing => complete circuit, values come from the records", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(1),
      payments: [payment()],
      entitlements: [ent()],
      subscriptions: [],
      unreadable: allReadable,
      publication: PUBLIC_LISTING,
    });
    assert.equal(t.state, "known");
    assert.equal(t.paymentStatus, "paid");
    assert.equal(t.packageKey, "rentas_business_monthly");
    assert.equal(t.entitlementStatus, "active");
    assert.equal(t.circuit?.severity, "ok");
    assert.equal(t.circuit?.paid, "done");
    assert.equal(t.amountPaidCents, 4900);
  });

  await check("commercial truth: NO payment record => 'no_payment_record', payment status null — never 'unpaid'/'pending'/'paid'", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(2),
      payments: [],
      entitlements: [],
      subscriptions: [],
      unreadable: allReadable,
      publication: null,
    });
    assert.equal(t.state, "no_payment_record");
    assert.equal(t.paymentStatus, null);
    assert.equal(t.circuit, null, "no circuit is invented without a payment record");
  });

  await check("commercial truth: unreadable payment source => UNKNOWN (state unknown, no status, no circuit) — never zero/none", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(3),
      payments: [payment()], // even if rows were somehow passed, an unreadable source claims nothing
      entitlements: [],
      subscriptions: [],
      unreadable: { ...allReadable, payments: true },
      publication: PUBLIC_LISTING,
    });
    assert.equal(t.state, "unknown");
    assert.equal(t.paymentStatus, null);
    assert.equal(t.circuit, null);
    assert.ok(t.unreadable.includes("leonix_payment_records"));
  });

  await check("commercial truth: unreadable entitlement/subscription source => circuit WITHHELD (no false 'fulfilment did not finish')", () => {
    for (const which of ["entitlements", "subscriptions"] as const) {
      const t = truthLib.deriveAdminListingCommercialTruth({
        listingId: UUID(1),
        payments: [payment()],
        entitlements: [],
        subscriptions: [],
        unreadable: { ...allReadable, [which]: true },
        publication: PUBLIC_LISTING,
      });
      assert.equal(t.state, "known");
      assert.equal(t.paymentStatus, "paid", "payment truth still shown");
      assert.equal(t.circuit, null, `${which} unreadable`);
      assert.match(t.note ?? "", /Circuit withheld/);
    }
  });

  await check("commercial truth: pending payment with a checkout session is 'attention' (paid confirmation missing), not paid", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(1),
      payments: [payment({ payment_status: "pending", package_entitlement_id: null, paid_at: null })],
      entitlements: [],
      subscriptions: [],
      unreadable: allReadable,
      publication: null,
    });
    assert.equal(t.paymentStatus, "pending");
    assert.equal(t.circuit?.paid, "waiting");
    assert.equal(t.circuit?.severity, "attention");
  });

  await check("commercial truth: payment points at an entitlement that does not exist => 'missing' (same as Payment Tracker)", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(1),
      payments: [payment({ package_entitlement_id: "ent-gone" })],
      entitlements: [],
      subscriptions: [],
      unreadable: allReadable,
      publication: PUBLIC_LISTING,
    });
    assert.equal(t.entitlementStatus, "missing");
    assert.equal(t.circuit?.severity, "attention");
  });

  await check("commercial truth: subscription active + cancel_at_period_end is shown as cancel_at_period_end", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(1),
      payments: [payment({ billing_mode: "subscription", stripe_subscription_id: "sub_1" })],
      entitlements: [ent()],
      subscriptions: [
        { listing_id: UUID(1), status: "active", cancel_at_period_end: true, stripe_subscription_id: "sub_1", updated_at: "2026-09-11T00:00:00Z" },
      ],
      unreadable: allReadable,
      publication: PUBLIC_LISTING,
    });
    assert.equal(t.subscriptionStatus, "cancel_at_period_end");
  });

  await check("commercial truth: entitlement without a payment record (comp/print grant) is reported as such, not as paid", () => {
    const t = truthLib.deriveAdminListingCommercialTruth({
      listingId: UUID(4),
      payments: [],
      entitlements: [ent({ listing_id: UUID(4) })],
      subscriptions: [],
      unreadable: allReadable,
      publication: null,
    });
    assert.equal(t.state, "no_payment_record");
    assert.equal(t.entitlementStatus, "active");
    assert.equal(t.paymentStatus, null);
  });

  await check("commercial truth: representative payment — a later abandoned retry never hides an earlier paid; a later refund is not hidden by an earlier paid", () => {
    const paid = payment({ id: "p-paid", payment_status: "paid", created_at: "2026-09-01T00:00:00Z" });
    const retry = payment({ id: "p-retry", payment_status: "canceled", created_at: "2026-09-05T00:00:00Z" });
    assert.equal(truthLib.pickRepresentativePayment([retry, paid])?.id, "p-paid");
    const refund = payment({ id: "p-refund", payment_status: "refunded", created_at: "2026-09-08T00:00:00Z" });
    assert.equal(truthLib.pickRepresentativePayment([paid, retry, refund])?.id, "p-refund");
    assert.equal(truthLib.pickRepresentativePayment([retry])?.id, "p-retry", "nothing money-final: newest wins");
    assert.equal(truthLib.pickRepresentativePayment([]), null);
  });

  // ═══ COMMERCIAL TRUTH — batch loader against a fake (read-only) Supabase ═══════════════════════
  await check("loader: 250 listing ids => every .in() query carries ≤100 ids; only reads (no write verbs exist on the client)", async () => {
    const calls: Call[] = [];
    const ids = Array.from({ length: 250 }, (_, i) => UUID(i + 1));
    const sb = fakeSupabase({ leonix_payment_records: { rows: [] }, listing_package_entitlements: { rows: [] }, leonix_subscription_records: { rows: [] } }, calls);
    const out = await truthLib.loadAdminListingCommercialTruth({ category: "rentas", listingIds: ids, supabase: sb });
    assert.equal(Object.keys(out).length, 250);
    assert.ok(calls.length >= 9, `3 tables × 3 chunks (got ${calls.length})`);
    for (const c of calls) assert.ok((c.ids ?? []).length <= truthLib.COMMERCIAL_TRUTH_IDS_PER_QUERY, `${c.table} chunk ${c.ids?.length}`);
    for (const id of ids) assert.equal(out[id].state, "no_payment_record");
  });

  await check("loader: joins payment + entitlement + subscription per listing and classifies the listing from the row", async () => {
    const calls: Call[] = [];
    const sb = fakeSupabase(
      {
        leonix_payment_records: { rows: [payment({ package_entitlement_id: "ent-1", stripe_subscription_id: "sub_1", billing_mode: "subscription" })] },
        listing_package_entitlements: { rows: [ent()] },
        leonix_subscription_records: {
          rows: [{ listing_id: UUID(1), status: "active", cancel_at_period_end: false, stripe_subscription_id: "sub_1", updated_at: "2026-09-11T00:00:00Z" }],
        },
      },
      calls,
    );
    const out = await truthLib.loadAdminListingCommercialTruth({
      category: "rentas",
      listingIds: [UUID(1), UUID(2)],
      listingRowsById: { [UUID(1)]: { status: "active", is_published: true, expires_at: null } },
      supabase: sb,
      now: new Date("2026-09-19T00:00:00Z"),
    });
    assert.equal(out[UUID(1)].state, "known");
    assert.equal(out[UUID(1)].subscriptionStatus, "active");
    assert.equal(out[UUID(1)].circuit?.headline, "Complete: paid → entitled → live");
    assert.equal(out[UUID(2)].state, "no_payment_record");
  });

  await check("loader: payment query error => UNKNOWN for every row; entitlement query error => circuit withheld (never a guessed status)", async () => {
    const sbPay = fakeSupabase({ leonix_payment_records: { error: "boom" }, listing_package_entitlements: { rows: [] }, leonix_subscription_records: { rows: [] } }, []);
    const a = await truthLib.loadAdminListingCommercialTruth({ category: "autos", listingIds: [UUID(1)], supabase: sbPay });
    assert.equal(a[UUID(1)].state, "unknown");
    assert.equal(a[UUID(1)].paymentStatus, null);
    const sbEnt = fakeSupabase({ leonix_payment_records: { rows: [payment()] }, listing_package_entitlements: { error: "boom" }, leonix_subscription_records: { rows: [] } }, []);
    const b = await truthLib.loadAdminListingCommercialTruth({ category: "autos", listingIds: [UUID(1)], supabase: sbEnt });
    assert.equal(b[UUID(1)].state, "known");
    assert.equal(b[UUID(1)].circuit, null);
    assert.ok(b[UUID(1)].unreadable.includes("listing_package_entitlements"));
  });

  await check("loader: non-UUID ids are UNKNOWN (never queried, never guessed)", async () => {
    const calls: Call[] = [];
    const out = await truthLib.loadAdminListingCommercialTruth({
      category: "rentas",
      listingIds: ["not-a-uuid"],
      supabase: fakeSupabase({}, calls),
    });
    assert.equal(out["not-a-uuid"].state, "unknown");
    assert.equal(calls.length, 0);
  });

  await check("loader source: read-only (no insert/update/upsert/delete/rpc) and reuses derivePaymentCircuit + publicationSemantics", () => {
    const src = strip(raw(P.truthLib));
    assert.ok(!/\.(insert|update|upsert|delete|rpc)\(/.test(src), "no write verbs");
    assert.match(src, /derivePaymentCircuit\(/);
    assert.match(src, /classifyPublication\(/);
    assert.match(src, /leonix_payment_records/);
    assert.match(src, /listing_package_entitlements/);
    assert.match(src, /leonix_subscription_records/);
    assert.ok(!/AdminListingMonetizationSummary|resolveCategoryListingMonetization/.test(src), "plan-config monetization is not paid truth");
  });

  // ═══ SHELL HELPERS ═════════════════════════════════════════════════════════════════════════════
  await check("summary: a null count renders '—' (never a fake 0); a real 0 renders '0'", () => {
    assert.equal(shell.adminCountText(null), "—");
    assert.equal(shell.adminCountText(undefined), "—");
    assert.equal(shell.adminCountText(0), "0");
    assert.equal(shell.adminCountText(1234), "1,234");
    const cells = shell.buildAdminCategorySummaryCells({
      slug: "rentas",
      total: 12,
      live: null,
      needsAttention: 0,
      paymentIssue: null,
      expired: null,
      sourceHealth: { ok: true, source: "public.listings", note: null },
      queryError: null,
    });
    const by = Object.fromEntries(cells.map((c) => [c.key, c]));
    assert.equal(by.total.value, "12");
    assert.equal(by.live.value, "—");
    assert.equal(by.live.tone, "neutral");
    assert.ok(by.live.title, "explains why it is unavailable");
    assert.equal(by.needsAttention.value, "0");
    assert.equal(by.paymentIssue.value, "—");
    assert.equal(by.expired, undefined, "expired appears only when non-null");
    assert.equal(by.sourceHealth.value, "OK");
  });

  await check("summary: expired shown when non-null (even 0); source problem is 'Problem' in red", () => {
    const cells = shell.buildAdminCategorySummaryCells({
      slug: "autos",
      total: 3,
      live: 1,
      needsAttention: 2,
      paymentIssue: 1,
      expired: 0,
      sourceHealth: { ok: false, source: "autos_classifieds_listings", note: "timeout" },
      queryError: "timeout",
    });
    const by = Object.fromEntries(cells.map((c) => [c.key, c]));
    assert.equal(by.expired.value, "0");
    assert.equal(by.paymentIssue.tone, "bad");
    assert.equal(by.sourceHealth.value, "Problem");
    assert.equal(by.sourceHealth.tone, "bad");
  });

  await check("filter bar: real status <select> options per category (no free text); listings set includes needs_review", () => {
    const listings = shell.adminStatusOptionsForCategory("rentas").map((o) => o.value);
    for (const v of ["needs_review", "active", "pending", "flagged", "unpublished", "sold", "removed"]) assert.ok(listings.includes(v), v);
    assert.ok(shell.adminStatusOptionsForCategory("autos").map((o) => o.value).includes("pending_payment"));
    assert.ok(shell.adminStatusOptionsForCategory("empleos").map((o) => o.value).includes("pending_review"));
    assert.ok(shell.adminStatusOptionsForCategory("ofertas-locales").map((o) => o.value).includes("approved"));
    assert.ok(shell.adminStatusOptionsForCategory("travel").map((o) => o.value).includes("changes_requested"));
    const withCustom = shell.adminStatusOptionsWithCurrent(shell.adminStatusOptionsForCategory("rentas"), "weird");
    assert.ok(withCustom.some((o) => o.value === "weird"), "a URL status outside the vocabulary stays visible");
  });

  await check("filter bar: limit choices come from adminQueueActionFlow (default 50, clamped 25–500) and include the current value", () => {
    assert.equal(flow.ADMIN_QUEUE_DEFAULT_LIMIT, 50);
    const d = shell.adminQueueLimitChoices(undefined);
    assert.equal(d.current, 50);
    assert.ok(d.choices.includes(50) && d.choices.includes(25) && d.choices.includes(500));
    assert.equal(shell.adminQueueLimitChoices("9999").current, 500);
    assert.equal(shell.adminQueueLimitChoices("1").current, 25);
    assert.ok(shell.adminQueueLimitChoices("150").choices.includes(150));
  });

  await check("filter bar: hidden inputs preserve scope/lane/category params, drop owned fields and transient action-proof params", () => {
    const hidden = shell.adminFilterHiddenParams(
      { scope: "live", lane: "negocios", q: "x", status: "active", owner: "u", leonix_ad_id: "L", limit: "100", action_status: "success", target: "abc", term: "expiring" },
      ["q", "status", "owner", "leonix_ad_id", "limit"],
    );
    const names = hidden.map((h) => h.name).sort();
    assert.deepEqual(names, ["lane", "scope", "term"]);
  });

  await check("filter: Leonix Ad ID / owner in-memory matchers are case-insensitive contains and blank = keep", () => {
    assert.equal(shell.adminRowMatchesLeonixAdIdFilter({ leonix_ad_id: "RENT-2026-000012" }, "rent-2026-0000"), true);
    assert.equal(shell.adminRowMatchesLeonixAdIdFilter({ leonix_ad_id: null }, "rent"), false);
    assert.equal(shell.adminRowMatchesLeonixAdIdFilter({ leonix_ad_id: null }, ""), true);
    assert.equal(shell.adminRowMatchesOwnerFilter({ owner_user_id: "ABC-123" }, "abc"), true);
    assert.equal(shell.adminRowMatchesOwnerFilter({ owner_id: "zzz" }, "abc"), false);
  });

  await check("row chips: Bienes Raíces lane (Negocio vs Privado/FSBO) + inventory role are computed from the shared FSBO predicate", () => {
    const priv = shell.adminListingRowChips({ category: "bienes-raices", seller_type: "personal" });
    assert.equal(priv.find((c) => c.key === "lane")?.labelKey, "catShell.chip.lanePrivado");
    const neg = shell.adminListingRowChips({ category: "bienes-raices", seller_type: "business", inventory_role: "main", br_inventory_group_id: "g1" });
    assert.equal(neg.find((c) => c.key === "lane")?.labelKey, "catShell.chip.laneNegocio");
    assert.equal(neg.find((c) => c.key === "role")?.labelKey, "catShell.chip.roleMain");
    assert.ok(neg.some((c) => c.key === "group"));
    const child = shell.adminListingRowChips({ category: "bienes-raices", seller_type: "business", inventory_role: "child", br_inventory_parent_listing_id: "p" });
    assert.equal(child.find((c) => c.key === "role")?.labelKey, "catShell.chip.roleChild");
    assert.equal(shell.adminListingRowChips({ category: "rentas", seller_type: "personal" }).find((c) => c.key === "lane"), undefined, "lane chip is a Bienes Raíces concept only");
  });

  await check("listing truth (generic listings row): payment hint only from a KNOWN payment record; active+published is PUBLIC", () => {
    const pub = shell.adminListingTruthForListingsRow({ status: "active", is_published: true, expires_at: null }, null);
    assert.equal(pub.semantic, "PUBLIC");
    const noRecord = shell.adminListingTruthForListingsRow({ status: "pending", is_published: false }, {
      listingId: "x", state: "no_payment_record", paymentRecordId: null, paymentStatus: null, paymentSource: null, packageKey: null, packageTier: null, billingMode: null,
      amountPaidCents: null, paidAt: null, entitlementId: null, entitlementStatus: null, entitlementEndsAt: null, subscriptionStatus: null, circuit: null, unreadable: [], note: null,
    });
    assert.notEqual(noRecord.semantic, "NOT_PUBLIC_PAYMENT", "no payment record => not claimed as 'waiting for payment'");
    const unpaid = shell.adminListingTruthForListingsRow({ status: "pending" }, {
      listingId: "x", state: "known", paymentRecordId: "p", paymentStatus: "pending", paymentSource: null, packageKey: null, packageTier: null, billingMode: null,
      amountPaidCents: null, paidAt: null, entitlementId: null, entitlementStatus: null, entitlementEndsAt: null, subscriptionStatus: null, circuit: null, unreadable: [], note: null,
    });
    assert.equal(unpaid.semantic, "NOT_PUBLIC_PAYMENT");
  });

  await check("commercial tone: unknown / not-known state is neutral (never green, never red)", () => {
    assert.equal(shell.adminCommercialTone(null), "neutral");
    assert.equal(shell.adminCommercialTone({ state: "unknown" } as never), "neutral");
    assert.equal(shell.adminCommercialTone({ state: "known", circuit: null } as never), "neutral");
    assert.equal(shell.adminCommercialTone({ state: "known", circuit: { severity: "attention" } } as never), "attention");
  });

  // ═══ HEADER ════════════════════════════════════════════════════════════════════════════════════
  await check("header: scope-aware title (Queue vs Live) by default when a category name is given; legacy title kept verbatim", () => {
    assert.equal(header.resolveCategoryHeaderTitle({ categoryName: "Rentas", scope: "live" }), "Rentas — Live");
    assert.equal(header.resolveCategoryHeaderTitle({ categoryName: "Rentas", scope: "queue" }), "Rentas — Queue");
    assert.equal(header.resolveCategoryHeaderTitle({ categoryName: "Rentas" }), "Rentas — Queue");
    assert.equal(header.resolveCategoryHeaderTitle({ title: "Edit listing (listings)" }), "Edit listing (listings)");
  });

  await check("header: strings are routed through adminTr (no hard-coded English chrome) and the Queue/Live switch + lane slot exist", () => {
    const src = strip(raw(P.header));
    assert.ok(!/Clasificados hub/.test(src) && !/"Public view"/.test(src) && !/"Publish"/.test(src) && !/Source: /.test(src), "no hard-coded header strings");
    for (const k of ["catShell.back", "catShell.publicView", "catShell.publish", "catShell.advanced", "catShell.source", "catShell.titleQueue", "catShell.titleLive"]) {
      assert.ok(strip(raw(P.header)).includes(k), k);
    }
    assert.match(src, /laneSlot/);
    assert.match(src, /queueHref/);
    assert.match(raw(P.header), /scopeLabel/, "legacy scopeLabel prop kept");
  });

  await check("strings: every catShell.* key exists in BOTH EN and ES dictionaries (adminTr resolves, no raw key leaks)", () => {
    const rep = strings.getAdminStringsKeyCoverageReport();
    const bad = [...rep.missingInEs, ...rep.missingInEn].filter((k) => k.startsWith("catShell."));
    assert.deepEqual(bad, []);
    for (const k of ["catShell.back", "catShell.summary.total", "catShell.section.commercial", "catShell.commercial.unknown", "catShell.autos.capacityActive"]) {
      assert.notEqual(strings.adminTr("en", k), k, k);
    }
    assert.equal(strings.adminTr("en", "catShell.titleLive", { name: "Autos" }), "Autos — Live");
  });

  // ═══ SCOPE TOGGLE (f) ══════════════════════════════════════════════════════════════════════════
  await check("scope toggle preserves Ofertas params (status_group, lane, commercial, scan_review, term, owner_id) + leonix_ad_id", () => {
    const sp = { q: "x", status_group: "review", lane: "flyer", commercial: "paid", scan_review: "flagged", term: "expiring", owner_id: "u1", leonix_ad_id: "OFR-1", scope: "live", junk: "no" };
    const href = scopeUrls.appendPreservedSearchParams("/admin/workspace/clasificados/ofertas-locales", sp, "live");
    const u = new URL(href, "https://x.test");
    for (const [k, v] of Object.entries({ q: "x", status_group: "review", lane: "flyer", commercial: "paid", scan_review: "flagged", term: "expiring", owner_id: "u1", leonix_ad_id: "OFR-1", scope: "live" })) {
      assert.equal(u.searchParams.get(k), v, k);
    }
    assert.equal(u.searchParams.get("junk"), null);
    const queue = new URL(scopeUrls.appendPreservedSearchParams("/x", sp, null), "https://x.test");
    assert.equal(queue.searchParams.get("scope"), null);
    assert.equal(queue.searchParams.get("term"), "expiring");
  });

  // ═══ AUTOS CAPACITY ════════════════════════════════════════════════════════════════════════════
  await check("autos capacity: STANDARD limit comes from the policy (10) — the page no longer hard-codes '/10'", () => {
    assert.equal(policy.STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, 10);
    const cap = capLib.describeDealerCapacity(11);
    assert.equal(cap.overStandard, true);
    assert.equal(capLib.describeDealerCapacity(10).overStandard, false);
    assert.equal(capLib.describeDealerCapacity(null).text, "—");
  });

  await check("autos capacity: group key = group id, else parent listing id, else own id (canonical helper re-used)", () => {
    const rows = [
      { id: "a1", lane: "negocios", status: "active", dealer_inventory_group_id: "G", dealer_inventory_parent_listing_id: "a1" },
      { id: "p2", lane: "negocios", status: "active", dealer_inventory_group_id: null, dealer_inventory_parent_listing_id: "p1" },
      { id: "p1", lane: "negocios", status: "active", dealer_inventory_group_id: null, dealer_inventory_parent_listing_id: null },
    ];
    assert.deepEqual(rows.map((r) => capLib.autosDealerGroupKey(r)), ["G", "p1", "p1"]);
    assert.equal(capLib.autosDealerGroupKey, summaryLib.autosDealerGroupKey, "one grouping rule, owned by adminCategorySummary");
  });

  await check("autos capacity: only DEALER owners visible on the page are read (unique, ≤100 per call)", async () => {
    const owners = capLib.dealerOwnersToRead([
      { id: "1", lane: "negocios", owner_user_id: "O1" },
      { id: "2", lane: "negocios", owner_user_id: "O1" },
      { id: "3", lane: "privado", owner_user_id: "P1" },
      { id: "4", lane: "negocios", owner_user_id: "" },
    ]);
    assert.deepEqual(owners, ["O1"]);
    const many = Array.from({ length: 250 }, (_, i) => ({ id: String(i), lane: "negocios", owner_user_id: `O${i}` }));
    const seen: number[] = [];
    await capLib.fetchAutosDealerCapacityForRows(many, {
      fetchTruth: async (ids) => {
        seen.push(ids.length);
        return okTruth({});
      },
    });
    assert.deepEqual(seen, [100, 100, 50]);
  });

  await check("autos capacity: the WHOLE group is counted from the canonical grouped count, not the truncated page (12 active, page shows 1)", async () => {
    const view = await capLib.fetchAutosDealerCapacityForRows(
      [{ id: "r0", lane: "negocios", owner_user_id: "O1", dealer_inventory_group_id: "GROUP-A" }],
      { fetchTruth: async () => okTruth({ "GROUP-A": 12 }) },
    );
    assert.equal(view.available, true);
    assert.equal(view.activeByGroupKey["GROUP-A"], 12);
    assert.equal(view.standardLimit, 10);
    const cap = capLib.describeDealerCapacity(12);
    assert.equal(cap.overStandard, true, "above standard => verify the inventory-pack entitlement");
    assert.equal(cap.overBoosted, false);
  });

  await check("autos capacity: chunk answers add (rows are disjoint across owner chunks)", () => {
    const view = capLib.foldDealerCapacityTruths([okTruth({ A: 3, B: 1 }), okTruth({ A: 2 })]);
    assert.equal(view.available, true);
    assert.deepEqual(view.activeByGroupKey, { A: 5, B: 1 });
  });

  await check("autos capacity: error, capped scan or a throw => available:false (page prints '—', never a wrong number)", async () => {
    const visible = [{ id: "r0", lane: "negocios", owner_user_id: "O1", dealer_inventory_group_id: "G" }];
    const err = await capLib.fetchAutosDealerCapacityForRows(visible, { fetchTruth: async () => ({ ...okTruth({ G: 3 }), ok: false, error: "boom" }) });
    assert.equal(err.available, false);
    assert.deepEqual(err.activeByGroupKey, {});
    const capped = await capLib.fetchAutosDealerCapacityForRows(visible, { fetchTruth: async () => ({ ...okTruth({ G: 3 }), capped: true }) });
    assert.equal(capped.available, false);
    const thrown = await capLib.fetchAutosDealerCapacityForRows(visible, { fetchTruth: async () => { throw new Error("net"); } });
    assert.equal(thrown.available, false);
    assert.equal(capLib.describeDealerCapacity(null).text, "—");
    const none = await capLib.fetchAutosDealerCapacityForRows([{ id: "x", lane: "privado", owner_user_id: "P" }], { fetchTruth: async () => { throw new Error("must not be called"); } });
    assert.equal(none.available, true, "no dealer rows visible => nothing to read");
  });

  // ═══ RENDERED COMPONENTS ═══════════════════════════════════════════════════════════════════════
  let renderOk = true;
  let html: (el: unknown) => string = () => "";
  let h: (t: unknown, p?: unknown, ...c: unknown[]) => unknown = () => null;
  try {
    const React = await import("react");
    // tsx compiles this repo's TSX with the classic runtime (tsconfig jsx = "preserve"): give it React.
    (globalThis as unknown as { React: unknown }).React = React;
    const server = await import("react-dom/server");
    h = (t, p, ...c) => React.createElement(t as never, p as never, ...(c as never[]));
    html = (el) => server.renderToStaticMarkup(el as never);
  } catch {
    renderOk = false;
  }

  if (renderOk) {
    const sections = await import("../app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminListingCardSections");
    const summaryPanel = await import("../app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminCategorySummaryPanel");
    const filterBar = await import("../app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminCategoryFilterBar");

    await check("render: commercial truth — 'not loaded', 'unknown' and 'no record' are stated plainly; nothing implies paid", () => {
      const notLoaded = html(h(sections.AdminCommercialTruthSection, { truth: undefined }));
      assert.match(notLoaded, /not loaded/i);
      assert.ok(!/Payment/.test(notLoaded));
      const unknown = html(h(sections.AdminCommercialTruthSection, { truth: { listingId: "x", state: "unknown", note: "n", unreadable: [] } }));
      assert.match(unknown, /could not be read/i);
      const none = html(h(sections.AdminCommercialTruthSection, { truth: { listingId: "x", state: "no_payment_record", entitlementStatus: null, subscriptionStatus: null, unreadable: [] } }));
      assert.match(none, /No payment record/i);
      assert.ok(!/>Paid</i.test(none));
    });

    await check("render: commercial truth (known) shows payment, package, entitlement, circuit headline and a read-only note", () => {
      const t = truthLib.deriveAdminListingCommercialTruth({ listingId: UUID(1), payments: [payment()], entitlements: [ent()], subscriptions: [], unreadable: allReadable, publication: PUBLIC_LISTING });
      const out = html(h(sections.AdminCommercialTruthSection, { truth: t }));
      assert.match(out, /Complete: paid/);
      assert.match(out, /rentas_business_monthly/);
      assert.match(out, /Active/);
      assert.match(out, /Read-only/);
      assert.match(out, /payment-tracker\?q=/);
    });

    await check("render: listing truth shows the raw status, public / not-public and the reason", () => {
      const out = html(
        h(sections.AdminListingTruthSection, {
          status: "pending",
          truth: { semantic: "NOT_PUBLIC_PAYMENT", reason: "Pending — waiting for payment to activate it.", rawStatus: "pending", source: "listings" },
        }),
      );
      assert.match(out, />pending</);
      assert.match(out, /Not public/);
      assert.match(out, /waiting for payment/i);
    });

    await check("render: AdminListingCardSections renders sections in order and OMITS empty ones (performance is never faked)", () => {
      const out = html(
        h(sections.AdminListingCardSections, {
          header: h("b", null, "H"),
          listingTruth: h("i", null, "LT"),
          commercialTruth: h("i", null, "CT"),
          actions: h("i", null, "AC"),
        }),
      );
      const order = ["admin-card-section-listing", "admin-card-section-commercial", "admin-card-section-actions"].map((k) => out.indexOf(k));
      assert.ok(order.every((i) => i >= 0) && order[0] < order[1] && order[1] < order[2], "order");
      assert.ok(!out.includes("admin-card-section-performance"));
      assert.ok(!out.includes("admin-card-section-moderation"));
    });

    await check("render: summary panel — null counts print '—', queryError shown honestly, technical source under Advanced / details", () => {
      const out = html(
        h(summaryPanel.AdminCategorySummaryPanel, {
          summary: { slug: "servicios", total: null, live: 4, needsAttention: null, paymentIssue: null, expired: null, sourceHealth: { ok: false, source: "servicios_public_listings", note: "n" }, queryError: "relation missing" },
          laneLabel: "Dealers de Autos",
        }),
      );
      assert.match(out, /admin-category-summary-total[\s\S]*?—/);
      assert.match(out, /relation missing/);
      assert.match(out, /Advanced \/ details/);
      assert.match(out, /Query source/);
      assert.match(out, /Counts are for lane: Dealers de Autos/);
      assert.ok(!/admin-category-summary-expired/.test(out));
    });

    await check("render: filter bar — Search, real-status <select>, Owner, Leonix Ad ID, Limit, extras via children; other params preserved", () => {
      const out = html(
        h(
          filterBar.AdminCategoryFilterBar,
          {
            action: "/admin/workspace/clasificados/rentas",
            searchParams: { scope: "live", q: "hello", status: "pending", limit: "100", lane: "x" },
            statusOptions: shell.adminStatusOptionsForCategory("rentas"),
            clearHref: "/admin/workspace/clasificados/rentas",
            extraFieldNames: ["lane"],
          },
          h("input", { name: "lane", defaultValue: "x" }),
        ),
      );
      assert.match(out, /<select name="status"/);
      assert.match(out, /<option value="pending" selected/);
      assert.match(out, /name="owner"/);
      assert.match(out, /name="leonix_ad_id"/);
      assert.match(out, /<select name="limit"/);
      assert.match(out, /<option value="100" selected/);
      assert.match(out, /<input type="hidden" name="scope" value="live"/);
      assert.ok(!/type="hidden" name="lane"/.test(out), "extra field owned by the child is not duplicated as hidden");
      assert.match(out, /method="get"/);
    });
  } else {
    console.log("SKIP: render checks (react-dom/server unavailable)");
  }

  // ═══ SOURCE GUARDS — generic shell ═════════════════════════════════════════════════════════════
  await check("generic shell: header is category-named + scope-aware, summary from fetchAdminCategorySummary, filter bar, context maps passed", () => {
    const src = strip(raw(P.queuePage));
    assert.match(src, /categoryName=\{categoryName\}/);
    assert.match(src, /scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(src, /fetchAdminCategorySummary\(categorySlug\)/);
    assert.match(src, /<AdminCategorySummaryPanel/);
    assert.match(src, /<AdminCategoryFilterBar/);
    assert.match(src, /adminStatusOptionsForCategory\(categorySlug\)/);
    assert.match(src, /leonix_ad_id/);
    assert.match(src, /fetchListingFlagContextMaps\(/);
    for (const p of ["flagReportByListingId={flagContext.reportsByListingId}", "ownerEmailByUserId={flagContext.ownerEmailByUserId}", "aiReviewByListingId={flagContext.aiReviewByListingId}", "commercialTruthByListingId={commercialTruthByListingId}"]) {
      assert.ok(src.includes(p), p);
    }
    assert.match(src, /loadAdminListingCommercialTruth\(/);
    // preserved behaviour
    assert.match(src, /ClasificadosLiveScopePanel/);
    assert.match(src, /categorySlug === "bienes-raices"/);
    assert.match(src, /<BienesNegocioOpsPanel/);
    assert.ok(!/name="status"[\s\S]{0,80}autoComplete/.test(src), "status is no longer a free-text input");
  });

  await check("generic table: COMMERCIAL TRUTH renders in the STAFF row and mobile card (not only the dead !staffQueueMode branch)", () => {
    const src = raw(P.table);
    const jsxUses = src.match(/<AdminCommercialTruthSection/g) ?? [];
    assert.ok(jsxUses.length >= 2, `staff desktop + mobile (found ${jsxUses.length})`);
    const staffCell = src.indexOf('data-testid="clasificados-row-commercial-truth"');
    const legacyMonetization = src.indexOf("<AdminListingMonetizationSummary");
    assert.ok(staffCell > 0 && legacyMonetization > 0 && staffCell < legacyMonetization, "staff branch precedes the legacy branch");
    assert.match(src, /commercialTruthByListingId\?: AdminListingCommercialTruthMap/);
    assert.match(src, /import type \{ AdminListingCommercialTruthMap \}/, "client bundle imports only the TYPE from the server loader");
    assert.match(src, /<AdminListingCardSections/, "mobile card uses the shared sections layout");
    assert.match(src, /<AdminRowChips row=\{row\}/, "BR lane / inventory role chips are visible in the staff row");
    assert.match(src, /adminListingTruthForListingsRow\(/);
    // plan-config monetization is not presented as paid truth in the staff row
    const staffRowStart = src.indexOf('data-testid="clasificados-row-commercial-truth"');
    assert.ok(!src.slice(staffRowStart - 1500, staffRowStart + 400).includes("AdminListingMonetizationSummary"));
  });

  await check("client-safety: components / helpers import only TYPES from the server-side commercial loader", () => {
    for (const rel of [P.sections, P.shell, P.table]) {
      const src = raw(rel);
      const imports = src.match(/import[^;]*adminListingCommercialTruth"/g) ?? [];
      assert.ok(imports.length > 0 && imports.every((i) => /import type/.test(i)), `${rel}: ${imports.join(" | ")}`);
    }
  });

  await check("commercial UI is read-only: no fetch/POST/PATCH/server action in the normalized section components", () => {
    const src = strip(raw(P.sections));
    assert.ok(!/fetch\(|method: "(POST|PATCH|PUT|DELETE)"|"use server"|useState|onClick/.test(src));
  });

  // ═══ SOURCE GUARDS — Autos ═════════════════════════════════════════════════════════════════════
  await check("autos page: scope-aware header, lane-aware shared summary, truthful dealer capacity, lane selector + row actions preserved", () => {
    const src = raw(P.autos);
    assert.match(src, /categoryName="Autos"/);
    assert.match(src, /scope=\{scope === "live" \? "live" : "queue"\}/);
    assert.match(src, /fetchAdminCategorySummary\("autos", lane !== "all" \? \{ lane \} : undefined\)/);
    assert.match(src, /<AdminCategorySummaryPanel/);
    assert.match(src, /fetchAutosDealerCapacityForRows\(rows\)/);
    assert.match(src, /STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT/);
    assert.ok(!/\/10`/.test(src) && !/active \$\{dealerActiveCount\}\/10/.test(src), "no hard-coded /10");
    assert.ok(!src.includes("dealerActiveCountByGroup"), "no page-row-local group count");
    assert.match(src, /data-testid="autos-lane-selector"/);
    assert.match(src, /laneSlot=/);
    assert.match(src, /ADMIN_AUTOS_LANE_OPTIONS/);
    assert.match(src, /<ClassifiedAdminRowActions/);
    assert.match(src, /variant="autos"/);
    assert.match(src, /<AdminCommercialTruthSection/);
    assert.match(src, /<AdminCategoryFilterBar/);
    assert.match(src, /adminStatusOptionsForCategory\("autos"\)/);
    assert.match(src, /listAllAutosClassifiedsRowsForAdmin\(memoryFiltered \? 500 : queueLimit/);
  });

  await check("autos lane work from d3ed73ab is intact (lane module, hub lane panel, lane param preserved on scope links)", () => {
    const lanes = raw("app/admin/_lib/adminAutosLanes.ts");
    assert.match(lanes, /ADMIN_AUTOS_LANE_OPTIONS/);
    assert.match(lanes, /parseAdminAutosLane/);
    assert.match(raw(`${CLAS}/_components/ClasificadosCategoryPanelShared.tsx`), /clasificados-autos-lane-panel/);
    assert.match(raw(P.autos), /appendPreservedSearchParams\(autosBase, sp, "live", \["lane"\]\)/);
  });

  await check("d3ed73ab reactivation policy + republish route wiring untouched", () => {
    assert.match(raw("app/api/admin/clasificados/listings/[id]/route.ts"), /decideAdminReactivation\(/);
    assert.match(raw("app/admin/_lib/adminReactivationPolicy.ts"), /decideAdminReactivation/);
  });

  await check("AI moderation stays advisory (flag-truth block keeps the advisory copy and the shared truth classifier)", () => {
    const b = raw(`${CLAS}/_components/AdminListingFlagTruthBlock.tsx`);
    assert.match(b, /AI_REVIEW_ADVISORY_COPY/);
    assert.match(b, /classifyGenericListingFlagTruth/);
  });

  if (failures.length) {
    console.error(`\nverify-closeout2-admin-shell FAILED (${failures.length})`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nverify-closeout2-admin-shell PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
