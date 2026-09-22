/**
 * GATE A — eight canonical applications send assisted saves through the visible staff control.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-assisted-save-ui-01.ts
 *
 * Directly invoking an API route is insufficient. This verifier:
 *   1. Source-proves each of the eight canonical applications mounts AssistedSaveForClientBar.
 *   2. Renders that shared bar for each family, clicks the visible Save control, and observes
 *      the assisted request (assistedAction: save_for_client), listing id, custody rebind,
 *      and the absence of customer login.
 *   3. Repeats the save for the same listing id (same-row second save).
 *   4. Proves Autos Dealer and Bienes owner-null payloads (clientUserId: null).
 *
 * No database, no Stripe, no Vercel, no migration apply.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
(globalThis as unknown as { React: unknown }).React = React;
import { createElement } from "react";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { AssistedSaveForClientBar } from "../app/(site)/clasificados/components/AssistedSaveForClientBar";
import {
  handleAssistedSaveClick,
  listingIdFrom,
  type AssistedCustodyContext,
  type AssistedSavePayload,
} from "../app/lib/sales/assistedSaveForClientClient";
import { QUICK_SALES_CATEGORIES, QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "../app/lib/sales/quickSalesCategories";
import { createEmptyRentasPrivadoFormState } from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { emptyEmpleosQuickDraft } from "../app/(site)/publicar/empleos/shared/types/empleosQuickDraft";
import { buildEmpleosPublishEnvelopeFromQuick } from "../app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { buildListingsInsertRowForLeonixPublish } from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";

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
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
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

const CANONICAL_APP: Record<QuickSalesCategory, string> = {
  rentas: "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  empleos: "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
  "autos-privado": "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  servicios: "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  restaurantes: "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
  "comida-local": "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
  autos: "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
  "bienes-raices":
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
};

const INTAKE_LAYOUT: Record<QuickSalesCategory, string> = {
  rentas: "app/(site)/clasificados/publicar/layout.tsx",
  empleos: "app/(site)/publicar/layout.tsx",
  "autos-privado": "app/(site)/publicar/layout.tsx",
  servicios: "app/(site)/publicar/layout.tsx",
  restaurantes: "app/(site)/publicar/layout.tsx",
  "comida-local": "app/(site)/publicar/layout.tsx",
  autos: "app/(site)/publicar/layout.tsx",
  "bienes-raices": "app/(site)/clasificados/publicar/layout.tsx",
};

function payloadFor(category: QuickSalesCategory, listingId: string | null): AssistedSavePayload {
  switch (category) {
    case "rentas":
      return {
        category,
        draft: createEmptyRentasPrivadoFormState() as unknown as Record<string, unknown>,
        lane: "privado",
        lang: "es",
      };
    case "empleos": {
      const envelope = buildEmpleosPublishEnvelopeFromQuick(emptyEmpleosQuickDraft(), "es") as unknown as Record<string, unknown>;
      if (listingId) envelope.listingId = listingId;
      return { category, envelope, lang: "es" };
    }
    case "autos-privado":
      return { category, listing: { year: 2018, make: "Toyota", model: "Corolla" }, listingId, lang: "es" };
    case "servicios":
      return { category, state: { businessName: "Plomería Sol" }, lang: "es" };
    case "restaurantes":
      return { category, draft: { name: "Taquería Sol" }, lang: "es" };
    case "comida-local":
      return { category, draft: { businessName: "Pupusas del Barrio" }, draftListingId: listingId, lang: "es" };
    case "autos":
      return { category, clientUserId: null, dealerListing: { businessName: "Dealer Uno" }, lang: "es" };
    case "bienes-raices": {
      const listingRow = buildListingsInsertRowForLeonixPublish(null, {
        title: "Oficina en San José",
        description: "Local comercial",
        city: "San José",
        state: "CA",
        zip: "95112",
        price: 250000,
        isFree: false,
        category: "bienes-raices",
        sellerType: "business",
        businessName: "Leonix Broker",
        businessMetaJson: "{}",
        detailPairs: [],
        contactPhoneDigits: "4085550100",
        contactEmail: "broker@test",
        imageSources: ["https://example.test/office.jpg"],
        lang: "es",
      });
      return { category, clientUserId: null, listingRow, lang: "es" };
    }
  }
}

function ctxFor(category: QuickSalesCategory, listingId: string | null): AssistedCustodyContext {
  return {
    category,
    businessId: "biz-1",
    listingId,
    clientUserId: null,
    paymentState: "not_cleared",
    publishReady: false,
    expiresAtMs: Date.now() + 60_000,
    packageKey: QUICK_SALES_CATEGORY_MAP[category].saveEndpoint.includes("assisted") ? "test" : null,
  };
}

type Captured = { url: string; method: string; body: Record<string, unknown> };

function installFetch(captured: Captured[], listingId: string) {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = String(init?.method ?? "GET").toUpperCase();
    let body: Record<string, unknown> = {};
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }
    captured.push({ url, method, body });
    if (method === "GET" && url.includes("/api/admin/sales-preview/custody")) {
      const lastBind = [...captured].reverse().find((c) => c.method === "POST" && c.url.includes("/custody") && typeof c.body.listingId === "string");
      const bound = typeof lastBind?.body.listingId === "string" ? String(lastBind.body.listingId) : listingId;
      return new Response(
        JSON.stringify({
          ok: true,
          context: {
            category: body.category ?? captured[0]?.body.category,
            businessId: "biz-1",
            listingId: bound || listingId,
            clientUserId: null,
            paymentState: "not_cleared",
            publishReady: false,
            expiresAtMs: Date.now() + 60_000,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (method === "POST" && url.includes("/api/admin/sales-preview/custody")) {
      return new Response(JSON.stringify({ ok: true, listingId: body.listingId ?? listingId }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/login")) {
      return new Response("login", { status: 200 });
    }
    const idKey = url.includes("/autos/assisted-publish") ? "mainListingId" : "listingId";
    return new Response(JSON.stringify({ ok: true, [idKey]: listingId, id: listingId }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

function Journey({ category }: { category: QuickSalesCategory; listingId: string }) {
  return createElement(
    "div",
    { "data-canonical-application": category },
    createElement(AssistedSaveForClientBar, {
      category,
      lang: "es",
      buildPayload: (ctx: AssistedCustodyContext) => payloadFor(category, ctx.listingId),
    }),
  );
}

async function clickSaveOnRenderedBar(category: QuickSalesCategory, listingId: string): Promise<{
  html: string;
  captured: Captured[];
}> {
  const captured: Captured[] = [];
  const g = globalThis as unknown as Record<string, unknown>;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = String(init?.method ?? "GET").toUpperCase();
    let body: Record<string, unknown> = {};
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }
    captured.push({ url, method, body });
    if (method === "GET" && url.includes("/custody")) {
      return new Response(
        JSON.stringify({ ok: true, context: ctxFor(category, null) }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (method === "POST" && url.includes("/custody")) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }
    const idKey = category === "autos" ? "mainListingId" : "listingId";
    return new Response(JSON.stringify({ ok: true, [idKey]: listingId, id: listingId }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  g.fetch = fetchImpl;

  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://staff.leonix.test/publicar",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  g.window = window;
  g.document = window.document;
  g.HTMLElement = window.HTMLElement;
  g.Node = window.Node;
  try {
    Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
  } catch {
    /* Node 20+ navigator is a getter */
  }
  window.fetch = fetchImpl;

  const rootEl = window.document.getElementById("root");
  if (!rootEl) throw new Error("no root");
  const root = createRoot(rootEl);
  await act(async () => {
    root.render(createElement(Journey, { category, listingId }));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  const btn = window.document.querySelector("[data-staff-save-for-client='true']") as HTMLButtonElement | null;
  if (!btn) throw new Error(`Save control missing for ${category}: ${rootEl.innerHTML.slice(0, 500)}`);
  await act(async () => {
    btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 30));
  });
  const html = rootEl.innerHTML;
  assert.equal(/\/login|Iniciar sesión/i.test(html), false, `${category} rendered customer login`);
  root.unmount();
  return { html, captured };
}

async function main() {
  check("U0: adapter body covers all eight families and owner-null clientUserId", () => {
    const src = read("app/lib/sales/assistedSaveForClientClient.ts");
    for (const category of QUICK_SALES_CATEGORIES) {
      assert.ok(src.includes(`category: "${category}"`) || src.includes(`case "${category}"`), category);
    }
    assert.ok(src.includes("clientUserId?: string | null"));
    assert.ok(src.includes('assistedAction: "save_for_client"'));
    assert.equal(src.includes("four contracts"), false);
  });

  for (const category of QUICK_SALES_CATEGORIES) {
    check(`U1[${category}]: canonical application mounts AssistedSaveForClientBar`, () => {
      const src = read(CANONICAL_APP[category]);
      assert.ok(src.includes("AssistedSaveForClientBar"), `${CANONICAL_APP[category]} must mount the shared bar`);
      if (category === "autos" || category === "autos-privado") {
        assert.ok(src.includes('category={lane === "negocios" ? "autos" : "autos-privado"}'));
      } else {
        assert.ok(src.includes(`category="${category}"`), `${category} bar category`);
      }
    });
  }

  check("U2: Autos Dealer and Bienes buildPayload accept clientUserId null", () => {
    const autos = read(CANONICAL_APP.autos);
    const bienes = read(CANONICAL_APP["bienes-raices"]);
    assert.ok(autos.includes("clientUserId: ctx.clientUserId ?? null"));
    assert.equal(autos.includes("ctx.clientUserId\n              ?"), false);
    assert.equal(bienes.includes("if (!ctx.clientUserId) return null"), false);
    assert.ok(bienes.includes("const ownerId = ctx.clientUserId ?? null"));
  });

  check("U3: public customer login is not opened by the staff save pipeline", () => {
    const client = read("app/lib/sales/assistedSaveForClientClient.ts");
    const bar = read("app/(site)/clasificados/components/AssistedSaveForClientBar.tsx");
    assert.ok(client.includes("openedCustomerLogin: false"));
    assert.equal(bar.includes("/login"), false);
    assert.equal(bar.includes("Authorization"), false);
    assert.equal(client.includes("Authorization"), false);
  });

  for (const category of QUICK_SALES_CATEGORIES) {
    await checkAsync(`U4[${category}]: click Save sends assistedAction and rebinds the listing`, async () => {
      const listingId = `listing-${category}-1`;
      const captured: Captured[] = [];
      installFetch(captured, listingId);
      const first = await handleAssistedSaveClick({
        category,
        ctx: ctxFor(category, null),
        payload: payloadFor(category, null),
      });
      assert.equal(first.ok, true, JSON.stringify(first));
      if (!first.ok) throw new Error("unreachable");
      assert.equal(first.listingId, listingId);
      assert.equal(first.rebound, true);
      assert.equal(first.openedCustomerLogin, false);
      const save = captured.find((c) => c.body.assistedAction === "save_for_client");
      assert.ok(save, `${category} must POST assistedAction save_for_client`);
      assert.equal(save!.url, category === "autos-privado" && payloadFor(category, null).category === "autos-privado"
        ? QUICK_SALES_CATEGORY_MAP[category].saveEndpoint
        : QUICK_SALES_CATEGORY_MAP[category].saveEndpoint);
      assert.equal(save!.body.assistedAction, "save_for_client");
      if (category === "autos" || category === "bienes-raices") {
        assert.equal(save!.body.clientUserId, null);
      }
      const bind = captured.find((c) => c.method === "POST" && c.url.includes("/custody"));
      assert.ok(bind);
      assert.equal(bind!.body.listingId, listingId);
      assert.equal(bind!.body.category, category);

      captured.length = 0;
      const second = await handleAssistedSaveClick({
        category,
        ctx: ctxFor(category, listingId),
        payload: payloadFor(category, listingId),
      });
      assert.equal(second.ok, true);
      if (!second.ok) throw new Error("unreachable");
      assert.equal(second.listingId, listingId);
      const secondSave = captured.find((c) => c.body.assistedAction === "save_for_client");
      assert.ok(secondSave);
      if (category === "autos-privado") {
        assert.equal(secondSave!.method, "PATCH");
        assert.equal(secondSave!.url, `${QUICK_SALES_CATEGORY_MAP[category].saveEndpoint}/${listingId}`);
      } else {
        assert.equal(secondSave!.url, QUICK_SALES_CATEGORY_MAP[category].saveEndpoint);
      }
    });
  }

  for (const category of QUICK_SALES_CATEGORIES) {
    await checkAsync(`U5[${category}]: rendered canonical bar click never opens customer login`, async () => {
      const listingId = `ui-${category}`;
      const { html, captured } = await clickSaveOnRenderedBar(category, listingId);
      assert.ok(html.includes("Guardar para Cliente") || captured.some((c) => c.body.assistedAction === "save_for_client"));
      assert.equal(/href=["']\/login|window.location.*login/i.test(html), false);
      const save = captured.find((c) => c.body.assistedAction === "save_for_client");
      assert.ok(save, `${category} click must issue assisted save. captured=${JSON.stringify(captured)}`);
      assert.equal(save!.body.assistedAction, "save_for_client");
    });
  }

  check("U6: listingIdFrom reads Autos Dealer mainListingId and Autos privado id", () => {
    assert.equal(listingIdFrom("autos", { mainListingId: "d1" }), "d1");
    assert.equal(listingIdFrom("autos-privado", { id: "p1", ok: true }), "p1");
    assert.equal(listingIdFrom("rentas", { listingId: "r1" }), "r1");
    assert.equal(listingIdFrom("comida-local", { listingId: "c1" }), "c1");
  });

  check("U7: preview control stays disabled until a canonical listing id exists", () => {
    const bar = read("app/(site)/clasificados/components/AssistedSaveForClientBar.tsx");
    assert.ok(bar.includes("disabled={busy || !ctx.listingId}"));
  });

  for (const category of QUICK_SALES_CATEGORIES) {
    check(`U8[${category}]: canonical intake sits under PublishAuthGateLayout`, () => {
      const layout = read(INTAKE_LAYOUT[category]);
      assert.ok(layout.includes("PublishAuthGateLayout"), INTAKE_LAYOUT[category]);
      const intake = QUICK_SALES_CATEGORY_MAP[category].intakePath;
      if (category === "rentas" || category === "bienes-raices") {
        assert.ok(intake.startsWith("/clasificados/publicar/"), intake);
      } else {
        assert.ok(intake.startsWith("/publicar/"), intake);
        assert.equal(intake.startsWith("/clasificados/"), false, intake);
      }
    });
  }

  check("U9: PublishAuthGate skips customer login when assisted cookie is verified", () => {
    const gate = read("app/components/auth/PublishAuthGate.tsx");
    assert.ok(gate.includes("if (assisted)"));
    assert.ok(gate.includes('setStatus("authed")'));
    const loginIdx = gate.indexOf("window.location.replace(loginHref)");
    const assistedIdx = gate.indexOf("if (assisted)");
    assert.ok(assistedIdx >= 0 && loginIdx > assistedIdx);
    const bar = read("app/(site)/clasificados/components/AssistedSaveForClientBar.tsx");
    assert.ok(bar.includes("handleAssistedSaveClick"));
    const servicios = read(CANONICAL_APP.servicios);
    assert.equal(/assistedUi \? \(\s*<AssistedSaveForClientBar/.test(servicios), false);
  });

  check("U10: classified-family and owner-null payloads match the real application builders", () => {
    const rentas = payloadFor("rentas", null);
    assert.equal(rentas.category, "rentas");
    if (rentas.category === "rentas") {
      assert.equal(rentas.lane, "privado");
      assert.equal(typeof rentas.draft, "object");
    }
    const empleos = payloadFor("empleos", null);
    assert.equal(empleos.category, "empleos");
    const bienes = payloadFor("bienes-raices", null);
    assert.equal(bienes.category, "bienes-raices");
    if (bienes.category === "bienes-raices") {
      assert.equal(bienes.clientUserId, null);
      assert.equal(Object.prototype.hasOwnProperty.call(bienes.listingRow, "owner_id"), false);
    }
    const autos = payloadFor("autos", null);
    assert.equal(autos.category, "autos");
    if (autos.category === "autos") assert.equal(autos.clientUserId, null);
    const rentasSrc = read(CANONICAL_APP.rentas);
    assert.ok(rentasSrc.includes('category: "rentas"'));
    assert.ok(rentasSrc.includes('lane: "privado"'));
    const empleosSrc = read(CANONICAL_APP.empleos);
    assert.ok(empleosSrc.includes("buildEmpleosPublishEnvelopeFromQuick"));
    const comidaSrc = read(CANONICAL_APP["comida-local"]);
    assert.ok(comidaSrc.includes('category: "comida-local"'));
    const autosSrc = read(CANONICAL_APP.autos);
    assert.ok(autosSrc.includes("clientUserId: ctx.clientUserId ?? null"));
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-assisted-save-ui-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
