import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const map = read("app/lib/ofertas-locales/ofertasLocalesRuntimeSchemaMap.ts");
const endpoint = read("app/api/ofertas-locales/admin/readiness/route.ts");

for (const object of ["Gemini-compatible", "published_at/expires_at", "leonix_ad_id", "partner organizations", "source asset versions", "scan pages", "renewal attempts", "notification outbox"]) {
  must(map, object, `schema map object ${object}`);
}
must(map, "failClosedBehavior", "fail-closed mapping");
must(endpoint, "databaseChecksPerformed: false", "readiness does not fabricate DB state");

pass("ofertas-runtime-schema-compatibility-audit");
