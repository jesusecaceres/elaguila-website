import { assertContains, assertNotContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const component = read("app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerRenewalActionCenter.tsx");
const page = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const route = read("app/api/ofertas-locales/owner/[id]/renewal/route.ts");

assertContains(component, "Renovar / republicar", "Spanish renewal action center");
assertContains(component, "Renew / republish", "English renewal action center");
assertContains(component, "does not publish automatically", "truthful checkout state");
assertContains(component, "Start renewal", "real start action");
assertContains(component, "Submit renewal for review", "real submit action");
assertContains(component, "Cancel unpaid attempt", "real cancel action");
assertContains(component, "startRevenueCategoryCheckout", "real checkout client action");
assertContains(component, "renewalAttemptId: attempt.id", "checkout carries renewal attempt");
assertContains(component, "operation: \"renew_listing\"", "checkout carries renewal operation");
assertContains(page, "OfertasLocalesOwnerRenewalActionCenter", "owner page wiring");
assertContains(route, "renewal_authorization_required", "submit requires authorization");
assertNotContains(component, "mark paid", "no fake mark paid button");
assertNotContains(component, "instant publish", "no fake instant publish button");

pass("ofertas-owner-renewal-operations-audit");
