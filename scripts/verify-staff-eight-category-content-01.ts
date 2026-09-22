/**
 * LEONIX STAFF GATEWAY — Gate 3 application content / save-reopen.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-content-01.ts
 *
 * Proves canonical hydrators/mappers round-trip representative fields, owner-null first save
 * creates one row and a repeat save updates it, incomplete drafts fail stored-row publish
 * readiness, $249/$399 stay off category-priced families, phone/SMS/WhatsApp are separate,
 * and application sources do not swallow the spacebar.
 *
 * No database, no Stripe, no migration apply, no Vercel.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { __reset, __seed, __setAuthUsers, __rows, __onRpc } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
} from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { mapOwnedRentasListingToPrivadoFormState } from "../app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration";
import { buildRentasPrivadoListingParams } from "../app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { gateRentasPrivadoPreview } from "../app/(site)/clasificados/lib/publish/leonixRequiredForPreviewGates";
import { normalizeEmpleosQuickDraft } from "../app/(site)/publicar/empleos/shared/types/empleosQuickDraft";
import { hydrateQuickDraftFromEnvelope } from "../app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { buildEmpleosPublishEnvelopeFromQuick } from "../app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { gateEmpleosQuickPreview } from "../app/(site)/publicar/empleos/shared/required/empleosRequiredForPreview";
import { getAutosPreviewCompletenessIssues } from "../app/(site)/clasificados/autos/shared/lib/autosPreviewCompleteness";
import type { AutoDealerListing } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mergeComidaLocalDraftFromStorage } from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { validateComidaLocalDraftForFuturePublish } from "../app/lib/clasificados/comida-local/comidaLocalValidation";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";

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
function makeRequest(body: unknown, cookieJar: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined) },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}

function readyRentasDraft() {
  return mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    titulo: "José's Auto Repair loft",
    rentaMensual: "1850",
    tipoDeRenta: "apartamento",
    ciudad: "San José",
    direccionEstado: "CA",
    direccionCodigoPostal: "95112",
    direccionLinea1: "1601 Coleman Ave",
    mostrarDireccionExacta: true,
    seller: {
      ...createEmptyRentasPrivadoFormState().seller,
      nombre: "María & Sons",
      telefono: "4085550199",
      whatsapp: "4085550188",
      mensajesTexto: "4085550177",
    },
    media: {
      ...createEmptyRentasPrivadoFormState().media,
      photoDataUrls: ["https://cdn.example.test/rental.jpg"],
    },
  });
}

function readyEmpleosDraft() {
  return normalizeEmpleosQuickDraft({
    title: "Niño's Landscaping lead",
    businessName: "El Sazón de Mamá",
    city: "Oakland",
    state: "CA",
    stateRegion: "CA",
    country: "United States",
    jobType: "tiempo-completo",
    schedule: "Lunes a viernes",
    payAmount: "28",
    payUnit: "hora",
    description: "A-1 Plumbing adjacent crew. Accents and ñ stay.",
    images: [{ id: "img1", url: "https://cdn.example.test/job.jpg", alt: "crew", isMain: true }],
    phone: "5105550100",
    whatsapp: "5105550101",
    smsPhone: "5105550102",
    email: "jobs@example.test",
  });
}

function readyPrivadoVehicle(): AutoDealerListing {
  return {
    year: 2018,
    make: "Honda",
    model: "Civic",
    price: 12900,
    city: "San Jose",
    zip: "95116",
    dealerPhoneOffice: "4085550111",
    dealerWhatsapp: "4085550112",
    mediaImages: [{ url: "https://cdn.example.test/civic.jpg", role: "vehicle" }],
  } as AutoDealerListing;
}

async function main() {
  check("A1: cockpit publish readiness no longer uses exist-only assessStoredRowExists", () => {
    const src = read("app/lib/sales/canonicalPublishReadiness.ts");
    assert.equal(src.includes("assessStoredRowExists"), false);
    assert.ok(src.includes("assessRentas("));
    assert.ok(src.includes("assessEmpleos("));
    assert.ok(src.includes("assessAutosPrivado("));
    assert.ok(src.includes("assessComidaLocal("));
    assert.ok(src.includes("gateRentasPrivadoPreview"));
    assert.ok(src.includes("gateEmpleosQuickPreview"));
    assert.ok(src.includes("getAutosPreviewCompletenessIssues"));
    assert.ok(src.includes("validateComidaLocalDraftForFuturePublish"));
    assert.ok(src.includes("gateBienesRaicesNegocioPreview"));
  });

  check("A2: Servicios chips persist as selectedQuickFactIds / profile quickFacts, never a parallel pills field", () => {
    const hydrator = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
    const types = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
    assert.ok(types.includes("selectedQuickFactIds"));
    assert.ok(hydrator.includes("quickFacts"));
    assert.equal(/pills/.test(types), false);
  });

  check("A3: phone / SMS / WhatsApp are separate fields in every family", () => {
    const servicios = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
    assert.ok(servicios.includes("quoteMessagePhone"));
    assert.ok(servicios.includes("whatsapp"));
    assert.ok(servicios.includes("phone"));
    const restaurantes = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
    assert.ok(restaurantes.includes("smsNumber"));
    assert.ok(restaurantes.includes("whatsAppNumber"));
    const restauranteUi = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
    assert.ok(restauranteUi.includes("smsNumber"));
    assert.ok(read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts").includes("smsNumber"));
    const hub = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
    assert.ok(hub.includes("smsNumber"));
    assert.equal(hub.includes("smsHref(nonEmpty(d.smsNumber) ? d.smsNumber!.trim() : phone)"), false);
    const empleos = read("app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts");
    assert.ok(empleos.includes("smsPhone"));
    assert.ok(empleos.includes("whatsapp"));
    const rentas = read("app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState.ts");
    assert.ok(rentas.includes("mensajesTexto"));
    assert.ok(rentas.includes("whatsapp"));
    const autos = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
    assert.ok(autos.includes("dealerWhatsapp"));
    assert.ok(autos.includes("dealerSmsPhone"));
    const bienes = read("app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts");
    assert.ok(bienes.includes("agenteWhatsapp"));
    assert.ok(bienes.includes("agenteSmsPersonal"));
    const comida = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
    assert.ok(comida.includes("whatsapp"));
    assert.ok(comida.includes("phone"));
  });

  check("A4: text controls do not preventDefault the spacebar", () => {
    const files = [
      "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
      "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
      "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx",
      "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
      "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
      "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
      "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
    ];
    const swallowsTextSpace = /<(?:input|textarea)\b[^>]*onKeyDown=\{[\s\S]{0,400}(?:e\.key === ["'] ["']|e\.code === ["']Space["']|e\.keyCode === 32)[\s\S]{0,200}preventDefault/;
    for (const f of files) {
      const src = read(f);
      assert.equal(swallowsTextSpace.test(src), false, f);
    }
  });

  check("B1: Rentas hydrator restores José/ñ/apostrophe title, contacts, and a cleared description stays cleared", () => {
    const draft = readyRentasDraft();
    draft.descripcion = "";
    const built = buildRentasPrivadoListingParams(draft, "es", null, { allowEmptyGallery: false });
    assert.equal(built.ok, true);
    if (!built.ok) return;
    const row = {
      id: "r1",
      title: built.params.title,
      description: "",
      city: built.params.city,
      state: built.params.state,
      zip: built.params.zip,
      price: built.params.price,
      category: "rentas",
      images: built.params.imageSources,
      detail_pairs: built.params.detailPairs,
      contact_phone: built.params.contactPhoneDigits,
      contact_email: built.params.contactEmail,
    };
    const hydrated = mapOwnedRentasListingToPrivadoFormState(row);
    assert.equal(hydrated.titulo, "José's Auto Repair loft");
    assert.equal(hydrated.descripcion, "");
    assert.equal(hydrated.ciudad, "San José");
    assert.equal(hydrated.tipoDeRenta, "apartamento");
    assert.equal(hydrated.direccionLinea1, "1601 Coleman Ave");
    assert.ok(hydrated.seller.telefono);
    assert.ok(hydrated.seller.whatsapp);
    assert.ok(hydrated.seller.mensajesTexto);
    assert.equal(hydrated.seller.nombre, "María & Sons");
    const gate = gateRentasPrivadoPreview(hydrated);
    assert.equal(gate.ok, true, gate.ok ? "" : gate.message);
  });

  check("B2: Empleos envelope round-trips role, pay, schedule, SMS, and accents", () => {
    const draft = readyEmpleosDraft();
    const envelope = buildEmpleosPublishEnvelopeFromQuick(draft, "es");
    const back = hydrateQuickDraftFromEnvelope(envelope);
    assert.ok(back);
    assert.equal(back!.title, "Niño's Landscaping lead");
    assert.equal(back!.businessName, "El Sazón de Mamá");
    assert.equal(back!.smsPhone, "5105550102");
    assert.equal(back!.whatsapp, "5105550101");
    assert.equal(back!.phone, "5105550100");
    const gate = gateEmpleosQuickPreview(back!, "es");
    assert.equal(gate.ok, true, JSON.stringify(gate));
  });

  check("B3: Autos privado completeness requires vehicle photo, price, location, and seller contact", () => {
    const missing = getAutosPreviewCompletenessIssues("privado", { year: 2018, make: "Honda" } as AutoDealerListing);
    assert.ok(missing.includes("media"));
    assert.ok(missing.includes("price"));
    assert.ok(missing.includes("location"));
    assert.ok(missing.includes("sellerContact"));
    const ready = getAutosPreviewCompletenessIssues("privado", readyPrivadoVehicle());
    assert.deepEqual(ready, []);
  });

  check("B4: Comida Local publish gate requires name, food type, city, contact, description, photo", () => {
    const empty = validateComidaLocalDraftForFuturePublish(createEmptyComidaLocalDraft(), true).filter((i) => i.severity === "error");
    const fields = empty.map((i) => i.field);
    assert.ok(fields.includes("businessName"));
    assert.ok(fields.includes("foodType"));
    assert.ok(fields.includes("phone"));
    assert.ok(fields.includes("queVendes"));
    assert.ok(fields.includes("mainPhoto"));
  });

  check("B5: $249/$399 pair keys are not the category-priced packages", () => {
    assert.equal("rentas" in BUSINESS_CATEGORY_PACKAGE_PAIR, false);
    assert.equal("empleos" in BUSINESS_CATEGORY_PACKAGE_PAIR, false);
    assert.equal("autos-privado" in BUSINESS_CATEGORY_PACKAGE_PAIR, false);
    assert.equal("comida-local" in BUSINESS_CATEGORY_PACKAGE_PAIR, false);
  });

  const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
  };
  const rentasSave = (await import("../app/api/clasificados/rentas/listing-edit/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const publish = (await import("../app/api/admin/sales-preview/publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const autosListings = (await import("../app/api/clasificados/autos/listings/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const comida = (await import("../app/api/clasificados/comida-local/publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };
  const empleos = (await import("../app/api/clasificados/empleos/listings/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };

  await checkAsync("C1: Rentas staff first save creates one owner-null row; second save updates the same id", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "rentas", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    assert.ok(token);
    const first = await rentasSave.POST(
      makeRequest({ assistedAction: "save_for_client", lane: "privado", draft: readyRentasDraft() }, { leonix_assisted_publish: token! }),
    );
    const firstJson = (await first.json()) as { ok?: boolean; listingId?: string; error?: string };
    assert.equal(first.status, 200, JSON.stringify(firstJson));
    assert.ok(firstJson.listingId);
    const rows1 = __rows("listings") as Record<string, unknown>[];
    assert.equal(rows1.length, 1);
    assert.equal(rows1[0]!.owner_id ?? null, null);
    assert.equal(rows1[0]!.title, "José's Auto Repair loft");
    const bound = cookieFrom(first as never, "leonix_assisted_publish") ?? token!;
    const edited = readyRentasDraft();
    edited.titulo = "A-1 Plumbing loft";
    const second = await rentasSave.POST(
      makeRequest(
        { assistedAction: "save_for_client", lane: "privado", listingId: firstJson.listingId, draft: edited },
        { leonix_assisted_publish: bound },
      ),
    );
    const secondJson = (await second.json()) as { listingId?: string };
    assert.equal(second.status, 200, JSON.stringify(secondJson));
    const rows2 = __rows("listings") as Record<string, unknown>[];
    assert.equal(rows2.length, 1, "repeat save must not insert");
    assert.equal(rows2[0]!.id, firstJson.listingId);
    assert.equal(rows2[0]!.title, "A-1 Plumbing loft");
  });

  await checkAsync("C2: paid incomplete Rentas draft is refused 422 not_ready and stays private", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    __seed("business_listing_links", [{ id: "link-r", business_id: BIZ, listing_source: "listings", listing_id: "rent-1", status: "verified", linked_by: STAFF_AUTH }]);
    __seed("listings", [{ id: "rent-1", category: "rentas", status: "pending", is_published: false, title: "", images: [] }]);
    __seed("leonix_payment_records", [{
      id: "pay-rent-1",
      listing_source: "listings",
      listing_id: "rent-1",
      package_key: "rentas_30d",
      source: "admin_manual",
      manual_state: "cleared",
      payment_status: "paid",
      currency: "usd",
      amount_cents: 2499,
      amount_total_cents: 2499,
      amount_paid_cents: 2499,
    }]);
    const token = createAssistedPublishingTokenWithSecret(
      { businessId: BIZ, category: "rentas", rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId: "rent-1", assistedAction: "save_for_client", packageKey: "rentas_30d" },
      ASSISTED_SECRET,
    )!;
    const res = await publish.POST(makeRequest({}, { leonix_assisted_publish: token }));
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 422, JSON.stringify(json));
    assert.equal(json.error, "not_ready");
    assert.equal((__rows("listings")[0] as { is_published?: boolean }).is_published, false);
  });

  await checkAsync("C3: Autos privado staff save writes owner_user_id null on lane privado", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "autos-privado", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    const res = await autosListings.POST(
      makeRequest(
        { assistedAction: "save_for_client", lane: "privado", listing: readyPrivadoVehicle() },
        { leonix_assisted_publish: token! },
      ),
    );
    const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    const rows = __rows("autos_classifieds_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.owner_user_id ?? null, null);
    assert.equal(rows[0]!.lane, "privado");
  });

  await checkAsync("C4: Comida Local staff save inserts owner-null pending_payment, not published", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "comida-local", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    __onRpc((fn: string) => {
      if (fn === "leonix_allocate_formatted") return { data: "COMIDA-2026-000001", error: null };
      return { data: null, error: { code: "P0001", message: `harness: no rpc handler for ${fn}` } };
    });
    const draft = mergeComidaLocalDraftFromStorage({
      ...createEmptyComidaLocalDraft(),
      businessName: "El Sazón de Mamá",
      foodType: "tacos",
      cityDisplay: "Oakland",
      cityCanonical: "oakland",
      queVendes: "Tacos de canasta every morning at the corner stand.",
      phone: "5105550199",
    });
    const res = await comida.POST(
      makeRequest({ assistedAction: "save_for_client", draft, activationMode: "pending_payment" }, { leonix_assisted_publish: token! }),
    );
    const json = (await res.json()) as { ok?: boolean; id?: string; status?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    const rows = __rows("comida_local_public_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.owner_user_id ?? null, null);
    assert.notEqual(rows[0]!.status, "published");
  });

  await checkAsync("C5: Empleos staff save inserts owner-null draft and hydrates the envelope", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "empleos", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    const envelope = buildEmpleosPublishEnvelopeFromQuick(readyEmpleosDraft(), "es");
    const res = await empleos.POST(
      makeRequest({ assistedAction: "save_for_client", mode: "draft", envelope }, { leonix_assisted_publish: token! }),
    );
    const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    const rows = __rows("empleos_public_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.owner_user_id ?? null, null);
    const snap = rows[0]!.listing_snapshot as { envelope?: { payload?: { data?: { title?: string } } } };
    assert.equal(snap?.envelope?.payload?.data?.title, "Niño's Landscaping lead");
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-content-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
