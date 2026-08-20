import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const migration = read("docs/OFERTAS_MIGRATION_ACTIVATION_RUNBOOK.md");
const staging = read("docs/OFERTAS_STAGING_CERTIFICATION_RUNBOOK.md");
const incident = read("docs/OFERTAS_INCIDENT_AND_ROLLBACK_RUNBOOK.md");

for (const term of ["backup", "one migration at a time", "read-only schema verification", "rollback", "historical migrations must not be edited"]) {
  must(migration.toLowerCase(), term, `migration runbook ${term}`);
}
for (const term of ["readiness endpoint", "stripe flyer checkout", "gemini scan", "renewal flow", "focused mobile"]) {
  must(staging.toLowerCase(), term, `staging runbook ${term}`);
}
for (const term of ["symptom", "immediate containment", "prohibited action", "migration failure", "duplicate payment event", "notification delivery failure"]) {
  must(incident.toLowerCase(), term, `incident runbook ${term}`);
}

pass("ofertas-runbook-completeness-audit");
