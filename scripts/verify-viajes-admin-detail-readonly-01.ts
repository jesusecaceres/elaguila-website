/**
 * Viajes admin staged-listing detail — read-only micro-package verifier (01).
 *
 * Run:
 *   node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-viajes-admin-detail-readonly-01.ts
 *
 * Proves:
 *  - source pins: API route exports only GET, uses the sibling admin guard (leonix_admin cookie +
 *    isSupabaseAdminConfigured), performs no .update/.insert/.delete/.upsert/.rpc;
 *  - admin page is cookie-guarded (requireAdminCookie) and read-only;
 *  - queue links to the detail page;
 *  - buildViajesAdminDetailView handles a V1 negocios row, a V1 privado row, a V2 envelope row,
 *    and a garbage row without throwing, and never mutates the input row.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

import {
  buildViajesAdminDetailView,
  detectViajesStagedListingJsonShape,
} from "@/app/(site)/clasificados/viajes/lib/viajesAdminDetailView";
import type { ViajesStagedListingRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { emptyViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";

const read = (p: string) => readFileSync(p, "utf8");
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  fn();
  console.log(`OK: ${name}`);
}

const libPath = "app/(site)/clasificados/viajes/lib/viajesAdminDetailView.ts";
const routePath = "app/api/admin/viajes/staged-listings/[id]/route.ts";
const siblingRoutePath = "app/api/admin/viajes/staged-listings/route.ts";
const pagePath = "app/admin/(dashboard)/clasificados/viajes/business-offers/[id]/page.tsx";
const queuePath = "app/admin/(dashboard)/clasificados/viajes/business-offers/AdminViajesBusinessOffersModeration.tsx";

for (const p of [libPath, routePath, siblingRoutePath, pagePath, queuePath]) {
  assert.ok(existsSync(p), `missing ${p}`);
}

const lib = read(libPath);
const route = read(routePath);
const siblingRoute = read(siblingRoutePath);
const page = read(pagePath);
const queue = read(queuePath);

const MUTATION_RE = /\.(update|insert|delete|upsert|rpc)\s*\(/;

check("route exports only GET (no POST/PUT/PATCH/DELETE handlers)", () => {
  const handlers = [...route.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map((m) => m[1]);
  assert.deepEqual(handlers, ["GET"]);
  assert.ok(!/export\s+(const|let)\s+(POST|PUT|PATCH|DELETE)\b/.test(route));
});

check("route uses the same admin guard as sibling staged-listings route", () => {
  const guard = `if (!(await isVerifiedAdminSession(await cookies()))) {`;
  assert.ok(siblingRoute.includes(guard), "sibling guard drifted — re-align");
  assert.ok(route.includes(guard));
  assert.ok(route.includes(`{ ok: false, error: "Unauthorized" }, { status: 401 }`));
  assert.ok(route.includes("isSupabaseAdminConfigured()"));
  assert.ok(route.includes(`from "@/app/lib/supabase/server"`));
  // guard precedes the data read
  assert.ok(route.indexOf(guard) < route.indexOf("fetchViajesStagedRowById("));
});

check("route + page + lib perform no mutations", () => {
  for (const [name, src] of [
    ["route", route],
    ["page", page],
    ["lib", lib],
  ] as const) {
    assert.ok(!MUTATION_RE.test(src), `${name} contains a mutation call`);
  }
  assert.ok(!/updateViajesStagedListing|insertViajesStagedListing|ownerResubmit/.test(route + page + lib));
});

check("page is cookie-guarded and reads via fetchViajesStagedRowById", () => {
  assert.ok(page.includes("requireAdminCookie(jar)"));
  assert.ok(page.includes(`redirect("/admin/login")`));
  assert.ok(page.includes("fetchViajesStagedRowById(id)"));
  assert.ok(page.includes("notFound()"));
  assert.ok(!page.includes('"use client"'));
});

check("lib is pure (no server/db imports) and does not need serializeViajesOfferV2ForStaged", () => {
  assert.ok(!lib.includes("viajesStagedListingsDbServer"));
  assert.ok(!lib.includes("@/app/lib/supabase"));
  assert.ok(!lib.includes("serializeViajesOfferV2ForStaged"));
  assert.ok(lib.includes("normalizeViajesOfferToV2"));
});

check("queue links each row to the detail page", () => {
  assert.ok(queue.includes("/admin/clasificados/viajes/business-offers/${encodeURIComponent(r.id)}"));
});

function baseRow(over: Partial<ViajesStagedListingRow>): ViajesStagedListingRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    leonix_ad_id: null,
    slug: "fixture-offer",
    category: "viajes",
    lane: "business",
    owner_user_id: "owner-1",
    business_profile_slug: null,
    submitter_name: "Staff Fixture",
    submitter_email: "fixture@example.com",
    submitter_phone: null,
    title: "Row title",
    lifecycle_status: "submitted",
    is_public: false,
    review_notes: null,
    moderation_reason: null,
    hero_image_url: null,
    listing_json: {},
    lang: "es",
    submitted_at: "2026-09-01T00:00:00Z",
    reviewed_at: null,
    published_at: null,
    expires_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...over,
  };
}

check("V1 negocios row → normalized detail", () => {
  const row = baseRow({
    listing_json: {
      version: 1,
      negocios: {
        titulo: "Cancún todo incluido",
        destino: "Cancún, México",
        ciudadSalida: "San José, CA",
        duracion: "5 días",
        precio: "Desde $899",
        descripcion: "Paquete con hotel y vuelo.",
        imagenPrincipal: "https://cdn.example.com/hero.jpg",
        galeriaUrls: ["https://cdn.example.com/g1.jpg", "blob:local-only"],
        incluye: "Vuelo\nHotel",
        businessName: "Agencia Fixture",
        email: "agencia@example.com",
        website: "https://agencia.example.com",
        ctaType: "whatsapp",
      },
    },
  });
  const snapshot = JSON.stringify(row);
  const d = buildViajesAdminDetailView(row);
  assert.equal(JSON.stringify(row), snapshot, "input row mutated");
  assert.equal(d.sourceShape, "v1_negocios");
  assert.equal(d.basics.title, "Cancún todo incluido");
  assert.equal(d.basics.destination, "Cancún, México");
  assert.equal(d.basics.departure, "San José, CA");
  assert.equal(d.provider.name, "Agencia Fixture");
  assert.equal(d.provider.email, "agencia@example.com");
  assert.equal(d.media.heroUrl, "https://cdn.example.com/hero.jpg");
  assert.ok(d.media.gallery.every((g) => g.url.startsWith("https://")), "non-durable media leaked");
  assert.ok(d.travel.inclusions.includes("Vuelo"));
  assert.equal(d.identity.id, row.id);
  assert.equal(d.rawSanitized.version, 1);
  assert.equal(d.rawSanitized.sourceShape, "v1_negocios");
});

check("V1 privado row → normalized detail (no throw, private lane)", () => {
  const row = baseRow({
    lane: "private",
    listing_json: { version: 1, privado: { titulo: "Viaje en grupo", destino: "Oaxaca", displayName: "Ana" } },
  });
  const d = buildViajesAdminDetailView(row);
  assert.equal(d.sourceShape, "v1_privado");
  assert.equal(d.basics.title, "Viaje en grupo");
  assert.equal(d.identity.lane, "private");
});

check("V2 envelope row → detail uses offer + staff-only private exact", () => {
  const offer = emptyViajesOfferModelV2("business", "en");
  offer.basics.title = "Alaska cruise";
  offer.basics.destinationLabel = "Juneau, AK";
  offer.provider.name = "Cruise Co";
  offer.story = "Seven nights.";
  offer.highlights = [{ id: "p1", label: "Glaciers" }];
  offer.locations.privateExact = {
    ...offer.locations.privateExact,
    street: "1 Private St",
    city: "Juneau",
    publicLabel: "",
    showPublicly: false,
  };
  offer.media.images = [
    {
      id: "m1",
      url: "https://cdn.example.com/alaska.jpg",
      alt: "Glacier",
      galleryOrder: 0,
      isHero: true,
      isResultsCard: true,
      focal: { x: 0.5, y: 0.5 },
    } as (typeof offer.media.images)[number],
  ];
  const row = baseRow({ lang: "en", listing_json: { version: 2, offer } as unknown as Record<string, unknown> });
  const d = buildViajesAdminDetailView(row);
  assert.equal(d.sourceShape, "v2_offer");
  assert.equal(d.basics.title, "Alaska cruise");
  assert.equal(d.provider.name, "Cruise Co");
  assert.deepEqual(d.travel.highlights, ["Glaciers"]);
  assert.equal(d.media.heroUrl, "https://cdn.example.com/alaska.jpg");
  assert.ok(d.locations.privateExact, "private exact expected");
  assert.equal(d.locations.privateExact!.isPublic, false);
  assert.equal(d.locations.privateExact!.staffOnly, true);
  assert.equal(d.rawSanitized.version, 2);
});

check("garbage / empty listing_json → safe fallback to row title", () => {
  for (const lj of [{}, { version: 7 }, null as unknown as Record<string, unknown>]) {
    const d = buildViajesAdminDetailView(baseRow({ listing_json: lj }));
    assert.equal(d.sourceShape, "unknown");
    assert.equal(d.basics.title, "Row title");
    assert.equal(d.media.heroUrl, null);
  }
  assert.equal(detectViajesStagedListingJsonShape("nope"), "unknown");
});

console.log(`\nverify-viajes-admin-detail-readonly-01: ${checks} checks passed`);
