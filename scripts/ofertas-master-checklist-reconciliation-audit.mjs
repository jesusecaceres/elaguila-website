import { must, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const doc = read("docs/OFERTAS_PACKAGE_9_INTEGRATION_READINESS.md");
const checklist = read("docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md");

for (const id of ["C1", "D2", "H3", "I1", "J1", "K1", "L1", "M1", "N4", "P6"]) {
  must(doc, new RegExp(`\\| ${id} \\|`), `reconciled ${id}`);
}
must(doc, "RESOLVED BUT ENVIRONMENT UNVERIFIED", "environment-unverified status");
must(doc, "Package 8", "Package 8 resolver evidence");
must(checklist, "Q1: DONE - Package 9", "master checklist Package 9 update");

pass("ofertas-master-checklist-reconciliation-audit");
