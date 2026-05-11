/**
 * Servicios publish transport: Blob upload path, minimal payload, no data: in POST body.
 * Run: npx tsx scripts/servicios-publish-media-smoke.ts
 */
import assert from "node:assert/strict";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import {
  buildServiciosPublishPayload,
  buildServiciosPublishTransportBody,
} from "../app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload";
import {
  coerceServiciosMediaRefToString,
  isServiciosPublishableRemoteMediaUrl,
} from "../app/(site)/clasificados/publicar/servicios/lib/serviciosMediaTransport";
import { parseServiciosDraftMediaUploadResult } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosDraftUploadParse";

const tinyData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const httpsCover = "https://images.unsplash.com/photo-1581578731548-c64695cc6952";

function baseState() {
  return normalizeClasificadosServiciosApplicationState(createDefaultClasificadosServiciosState());
}

function main() {
  assert.equal(coerceServiciosMediaRefToString({ url: httpsCover }), httpsCover);
  assert.equal(coerceServiciosMediaRefToString({ publicUrl: httpsCover }), httpsCover);

  const withData = normalizeClasificadosServiciosApplicationState({
    ...baseState(),
    businessName: "Smoke Media",
    city: "San José",
    coverUrl: tinyData,
    logoUrl: tinyData,
    aboutText: "About",
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
    selectedServiceIds: ["plom_fugas"],
    enableCall: true,
    phone: "4085551212",
  });

  const rawTransport = JSON.stringify({ state: withData, lang: "es" });
  assert.ok(rawTransport.length > 500, "fixture should include heavy data: URLs");

  const cleaned = buildServiciosPublishPayload(withData);
  assert.equal(cleaned.coverUrl, "", "data: cover must be stripped in transport payload");
  assert.equal(cleaned.logoUrl, "", "data: logo must be stripped");
  const transport = buildServiciosPublishTransportBody(cleaned, "es");
  const out = JSON.stringify(transport);
  assert.ok(out.length < rawTransport.length, "sanitized payload should be smaller than raw data-url draft");
  assert.ok(!out.includes("data:image/"), "transport JSON must not contain data:image");

  const remote = normalizeClasificadosServiciosApplicationState({
    ...baseState(),
    businessName: "Smoke Remote",
    city: "San José",
    coverUrl: httpsCover,
    aboutText: "About",
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
    selectedServiceIds: ["plom_fugas"],
    enableCall: true,
    phone: "4085551212",
  });
  const pub = buildServiciosPublishPayload(remote);
  assert.ok(isServiciosPublishableRemoteMediaUrl(pub.coverUrl), "https cover survives transport build");

  const byteSize = new Blob([JSON.stringify(buildServiciosPublishTransportBody(pub, "es"))]).size;
  assert.ok(byteSize < 1024 * 1024, `payload should stay under 1 MB (got ${byteSize})`);

  const otro = normalizeClasificadosServiciosApplicationState({
    ...baseState(),
    businessName: "Otro Servicio Biz",
    city: "San José",
    coverUrl: httpsCover,
    aboutText: "About",
    customServicesOffered: ["Instalación de riego"],
    customServiceDescription: "Servicio personalizado premium",
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
    selectedServiceIds: [],
    enableCall: true,
    phone: "4085551212",
  });
  const po = buildServiciosPublishPayload(otro);
  assert.ok(
    po.customServicesOffered?.some((s) => s.includes("riego")),
    "custom service lines must survive publish payload",
  );
  assert.ok(
    (po.customServiceDescription ?? "").includes("premium"),
    "custom service description must survive (never collapse to bare Otro label here)",
  );

  const p413 = parseServiciosDraftMediaUploadResult(413, "text/plain; charset=utf-8", "Request Entity Too Large");
  assert.equal(p413.ok, false);
  assert.equal(p413.error, "media_upload_payload_too_large");

  const p413json = parseServiciosDraftMediaUploadResult(
    413,
    "application/json",
    JSON.stringify({ ok: false, error: "file_too_large", detail: "too big" }),
  );
  assert.equal(p413json.ok, false);
  assert.equal(p413json.error, "file_too_large");

  const okJson = parseServiciosDraftMediaUploadResult(
    200,
    "application/json",
    JSON.stringify({ ok: true, publicUrl: "https://blob.example/x" }),
  );
  assert.equal(okJson.ok, true);
  assert.equal(okJson.publicUrl, "https://blob.example/x");

  console.log("servicios-publish-media-smoke: OK");
}

main();
