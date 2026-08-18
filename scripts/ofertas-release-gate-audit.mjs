import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const release = read("app/lib/ofertas-locales/ofertasLocalesReleaseReadiness.ts");
const endpoint = read("app/api/ofertas-locales/admin/readiness/route.ts");

for (const state of ["repository_ready", "ready_for_migration_application", "ready_for_staging_validation", "staging_certified", "production_ready"]) {
  must(release, state, `release state ${state}`);
}
must(release, "stagingCertified: false", "no staging certification claim");
must(release, "productionReady: false", "no production ready claim");
must(endpoint, "evaluateOfertaLocalReleaseReadiness", "endpoint uses release evaluator");

pass("ofertas-release-gate-audit");
