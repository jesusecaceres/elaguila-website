import assert from "node:assert/strict";

const baseUrl = (process.env.BIENES_PREVIEW_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const url = `${baseUrl}/clasificados/publicar/bienes-raices/negocio/agente-individual/preview?applicationInstanceId=br-agent-app-route-smoke&lang=es`;

const response = await fetch(url, { redirect: "manual" });
assert.notEqual(response.status, 404, `expected preview route not to 404: ${url}`);
assert.ok(response.status >= 200 && response.status < 300, `expected HTTP 2xx, got ${response.status}: ${url}`);

const body = await response.text();
assert.ok(body.includes("__next") || body.includes("Vista previa") || body.includes("Preview"), "expected a Next/preview response body");

console.log(`smoke-bienes-agente-preview-route-200-01: PASS ${response.status}`);
