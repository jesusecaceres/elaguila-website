import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const renewal = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/renewal/route.ts");
const adminRoute = read("app/api/ofertas-locales/admin/[id]/renewals/route.ts");
const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");

assertContains(ownerRoute, "getBearerUserId", "owner auth");
assertContains(ownerRoute, ".eq(\"owner_id\", ownerId)", "owner-scoped mutation");
assertContains(adminRoute, "requireAdminCookie", "admin auth");
assertContains(renewal, "ofertaLocalCommercialProductMatchesOfferType", "server product validation");
assertContains(renewal, "leonix_ad_id", "same Leonix identity");
assertContains(migration, "ofertas_renewal_one_open_attempt_idx", "duplicate open renewal prevention");
assertContains(migration, "ofertas_public_terms_renewal_once_idx", "repeated activation prevention");
assertContains(migration, "security invoker", "no exposed security definer");
assertNotContains(migration, "security definer", "security definer forbidden in exposed schema");
assertNotContains(ownerRoute, "ownerId = body", "no client owner trust");

pass("ofertas-package-8-security-idempotency-audit");
