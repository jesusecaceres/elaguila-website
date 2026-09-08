import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const renewals = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/renewal/route.ts");

assertContains(renewals, "OFERTAS_RENEWAL_ELIGIBLE_DAYS_REMAINING = 14", "14-day renewal window");
assertContains(renewals, "resolveOfertaLocalRenewalEligibility", "server-side eligibility resolver");
assertContains(renewals, "blocked_ownership", "owner boundary");
assertContains(renewals, "blocked_missing_identity", "Leonix ID requirement");
assertContains(renewals, "loadOpenOfertaLocalRenewalAttempt", "duplicate open attempt prevention");
assertContains(ownerRoute, "getBearerUserId", "authenticated owner route");
assertContains(ownerRoute, ".eq(\"owner_id\", ownerId)", "owner-scoped renewal mutation");

pass("ofertas-renewal-eligibility-audit");
