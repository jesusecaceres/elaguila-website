import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const doc = read("docs/OFERTAS_PACKAGE_8_RENEWAL_OPERATIONS_LAUNCH.md");
const checklist = read("docs/OFERTAS_PACKAGE_3_MASTER_CHECKLIST.md");

assertContains(doc, "Package 4A provider compatibility", "migration order 4A");
assertContains(doc, "Package 4B 30-day term", "migration order 4B");
assertContains(doc, "Package 5 commercial/identity", "migration order 5");
assertContains(doc, "Package 6 partners/analytics/assets", "migration order 6");
assertContains(doc, "Package 7 scan/review/publication", "migration order 7");
assertContains(doc, "Package 8 renewal/operations", "migration order 8");
assertContains(doc, "migrations remain unapplied", "migration not applied truth");
assertContains(doc, "external services not called", "external-service safety");
assertContains(checklist, "Package 8", "master checklist Package 8 update");

pass("ofertas-package-8-launch-readiness-audit");
