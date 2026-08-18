import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const route = read("app/api/ofertas-locales/admin/[id]/renewals/route.ts");

assertContains(route, "requireAdminCookie", "admin authorization");
assertContains(route, "approve", "approve action");
assertContains(route, "request_correction", "correction action");
assertContains(route, "retry_activation", "activation retry action");
assertContains(route, "renewal_not_ready_for_activation", "state transition guard");
assertContains(route, "ofertas_local_public_terms", "term history inspection");
assertContains(route, "payment_record_id", "payment provenance visible");
assertContains(route, "partner_assignment_id", "courtesy provenance visible");
assertNotContains(route, "mark_stripe_paid", "no manual paid fabrication");
assertNotContains(route, "add_days", "no arbitrary day extension");

pass("ofertas-admin-renewal-operations-audit");
