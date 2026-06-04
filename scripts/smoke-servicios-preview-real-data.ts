/**
 * Gate S3B — seller Servicios preview must map real application data only (no demo fallback).
 * Run: npx tsx scripts/smoke-servicios-preview-real-data.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import type { ServiciosApplicationDraft } from "../app/(site)/servicios/types/serviciosApplicationDraft";

const DEMO_MARKER = "Expert Home Solutions";

function main() {
  const sellerPreview = readFileSync(
    join(__dirname, "../app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx"),
    "utf8",
  );
  assert.ok(!sellerPreview.includes("getServiciosWireProfileFromSample"), "S3B: seller preview must not import demo wire");
  assert.ok(!sellerPreview.includes('source === "expert"'), "S3B: seller preview must not use expert demo source");
  assert.ok(!sellerPreview.includes("sample=expert"), "S3B: seller preview must not document sample=expert fallback");
  assert.ok(sellerPreview.includes("Completa la información de tu servicio"), "S3B: Spanish incomplete preview copy");
  assert.ok(sellerPreview.includes("Complete your service information to preview"), "S3B: English incomplete preview copy");
  assert.ok(!sellerPreview.includes(DEMO_MARKER), "S3B: seller preview file must not embed demo business name");

  const legacyPreview = readFileSync(
    join(__dirname, "../app/(site)/servicios/perfil/preview/ServiciosPreviewClient.tsx"),
    "utf8",
  );
  assert.ok(
    !legacyPreview.includes('setDraft(getServiciosApplicationDraftSample("expert"'),
    "S3B: legacy preview must not auto-load expert sample",
  );

  const standardDraft: ServiciosApplicationDraft = {
    identity: { slug: "servicios-qa-real-data", businessName: "Servicios QA Real Data" },
    hero: { primaryCategory: "Mecánico", locationSummary: "Houston, TX" },
    contact: { phone: "+1 713 555 0100" },
    services: [{ id: "svc-1", title: "Diagnóstico", secondaryLine: "", imageAlt: "Diagnóstico", visualVariant: "reparacion" }],
    about: { aboutText: "Taller mecánico de prueba QA." },
    quickFacts: [],
    gallery: [],
    galleryVideos: [],
    trust: [],
    highlights: [],
    reviews: [],
    serviceAreas: undefined,
    promotions: [],
    promo: { id: "p0", headline: "" },
    paymentMethodIds: [],
    customPaymentMethods: [],
    amenityOptionIds: [],
    customAmenityOptions: [],
    credentials: undefined,
  };

  const standardWire = mapServiciosApplicationDraftToBusinessProfile(standardDraft);
  const standardJson = JSON.stringify(standardWire);
  assert.ok(standardJson.includes("Servicios QA Real Data"), "S3B: standard draft maps real business name");
  assert.ok(!standardJson.includes(DEMO_MARKER), "S3B: standard draft wire has no demo business");
  assert.ok(!standardWire.reviews?.length, "S3B: standard draft has no fake reviews");
  assert.ok(standardWire.hero.rating == null, "S3B: standard draft has no fake rating");
  assert.ok(!standardWire.promotions?.length, "S3B: standard draft has no fake promo");

  const standardProfile = resolveServiciosProfile(standardWire, "es");
  assert.equal(standardProfile.identity.businessName, "Servicios QA Real Data");

  const proDraft: ServiciosApplicationDraft = {
    identity: { slug: "profesional-qa-real-data", businessName: "Profesional QA Real Data" },
    hero: { primaryCategory: "Abogado", locationSummary: "Dallas, TX" },
    contact: { phone: "+1 214 555 0100" },
    services: [{ id: "law-1", title: "Consulta legal", secondaryLine: "", imageAlt: "Consulta", visualVariant: "consulta" }],
    about: { aboutText: "Despacho de prueba QA." },
    quickFacts: [],
    gallery: [],
    galleryVideos: [],
    trust: [],
    highlights: [],
    reviews: [],
    serviceAreas: undefined,
    promotions: [],
    promo: { id: "p0", headline: "" },
    paymentMethodIds: [],
    customPaymentMethods: [],
    amenityOptionIds: [],
    customAmenityOptions: [],
    credentials: undefined,
  };

  const proWire = mapServiciosApplicationDraftToBusinessProfile(proDraft);
  const proJson = JSON.stringify(proWire);
  assert.ok(proJson.includes("Profesional QA Real Data"), "S3B: professional draft maps real business name");
  assert.ok(!proJson.includes(DEMO_MARKER), "S3B: professional draft wire has no demo contractor content");
  assert.ok(!proJson.includes("Ana M."), "S3B: professional draft has no fake review authors");
  assert.ok(!proJson.includes("$50 de descuento"), "S3B: professional draft has no fake promo");

  const proProfile = resolveServiciosProfile(proWire, "es");
  assert.equal(proProfile.identity.businessName, "Profesional QA Real Data");

  console.log("smoke-servicios-preview-real-data: OK");
}

main();
