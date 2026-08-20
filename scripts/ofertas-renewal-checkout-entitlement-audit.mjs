import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const payments = read("app/lib/listingPlans/revenuePaymentRecords.ts");
const commercial = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const renewals = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");

assertContains(payload, "renewalAttemptId", "renewal attempt payload");
assertContains(payments, "renewal_attempt_id", "payment metadata renewal reference");
assertContains(checkoutRoute, "operation: body.operation === \"renew_listing\"", "renewal checkout operation");
assertContains(checkoutRoute, "validateOfertasLocalesCheckoutOwnership", "server checkout ownership validation");
assertContains(commercial, "paymentRecordIsOfertaLocalRenewal", "renewal webhook discriminator");
assertContains(commercial, "markOfertaLocalRenewalPaymentAuthorized", "renewal entitlement authorization");
assertContains(renewals, "public_term_starts_on", "checkout does not start term metadata");
assertNotContains(commercial, "stripe_test", "no fake Stripe test data");

pass("ofertas-renewal-checkout-entitlement-audit");
