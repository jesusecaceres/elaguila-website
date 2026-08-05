/**
 * Package C Build 1 — Gates 7/8/9/13: recurring consent + Autos/Bienes convergence +
 * read-only success pages.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-consent-convergence-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildRecurringConsentText,
  RECURRING_CONSENT_AGREEMENT_VERSION,
  RECURRING_CONSENT_TEXT_VERSION,
} from "../app/lib/listingPlans/recurringConsentCopy";
import { parseRecurringConsentAcknowledgment } from "../app/lib/listingPlans/recurringConsentCopy";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — disclosure text: amount, interval, auto-renewal, cancellation, 7-day grace, clause 17. */
{
  for (const lang of ["es", "en"] as const) {
    const text = buildRecurringConsentText({ amountCents: 39900, lang });
    assert.ok(text.includes("$399.00"), "exact recurring amount shown");
    assert.ok(/al mes|per month/.test(text), "billing interval shown");
    assert.ok(/renueva automáticamente|renews automatically/.test(text), "automatic renewal disclosed");
    assert.ok(/cancele|cancel/i.test(text), "cancellation path disclosed");
    assert.ok(/7 días calendario|7-calendar-day/.test(text), "locked 7-day grace policy disclosed");
    assert.ok(/Mis Anuncios|My Listings/.test(text), "where to manage/cancel disclosed");
    assert.ok(text.includes("17"), "Agreement clause 17 cited");
    assert.ok(text.includes(RECURRING_CONSENT_AGREEMENT_VERSION), "agreement version cited");
  }
  assert.ok(RECURRING_CONSENT_TEXT_VERSION.length > 8, "consent text is versioned");
}

/* 2 — acknowledgment parsing: only an explicit affirmative + current shape passes. */
{
  assert.equal(parseRecurringConsentAcknowledgment(null), null);
  assert.equal(parseRecurringConsentAcknowledgment({}), null);
  assert.equal(parseRecurringConsentAcknowledgment({ accepted: "true", consentTextVersion: "x", lang: "es" }), null, "string 'true' is NOT affirmative consent");
  assert.equal(parseRecurringConsentAcknowledgment({ accepted: false, consentTextVersion: "x", lang: "es" }), null);
  assert.equal(parseRecurringConsentAcknowledgment({ accepted: true, lang: "es" }), null, "missing version rejected");
  const ok = parseRecurringConsentAcknowledgment({ accepted: true, consentTextVersion: "v", lang: "en" });
  assert.deepEqual(ok, { accepted: true, consentTextVersion: "v", lang: "en" });
}

/* 3 — server enforcement: recurring requires consent BEFORE session; one-time never does. */
{
  const consent = read("app/lib/listingPlans/recurringConsent.ts");
  assert.ok(consent.includes('billingMode === "monthly_subscription"'), "consent requirement keyed to subscription mode ONLY");
  assert.ok(consent.includes("consent_version_stale"), "stale consent version handled safely");
  assert.ok(consent.includes("consent_text_sha256") || consent.includes("hashConsentText"), "tamper-evident text hash stored");
  const route = read("app/api/revenue-os/checkout/route.ts");
  assert.ok(route.includes("if (packageRequiresRecurringConsent(packageDef))"), "one-time/free packages never require consent (gate is subscription-scoped)");
  assert.ok(
    route.indexOf("await createRecurringConsentRecord") < route.indexOf("await createPendingPaymentRecord"),
    "consent recorded before any checkout artifact (call order, not import order)",
  );
  assert.ok(route.includes("attachStripeIdentitiesToConsent"), "Stripe ids attached to the consent snapshot");
}

/* 4 — checkpoint UI: unchecked-by-default consent gating the final action for monthly mode. */
{
  const checkpoint = read("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");
  assert.ok(checkpoint.includes("const [recurringConsentChecked, setRecurringConsentChecked] = useState(false)"), "consent checkbox is unchecked by default — never pre-checked");
  assert.ok(checkpoint.includes("recurringConsentRequired = basePackageIsMonthly"), "requirement keyed to monthly subscription mode");
  assert.ok(checkpoint.includes("(!recurringConsentRequired || recurringConsentChecked)"), "final action disabled without consent");
  assert.ok(checkpoint.includes("buildRecurringConsentText"), "the EXACT versioned disclosure is rendered");
  assert.ok(checkpoint.includes("aria-describedby"), "consent checkbox is accessible");
  // The five recurring checkout clients forward the acknowledgment verbatim.
  for (const p of [
    "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
    "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
    "app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
  ]) {
    assert.ok(read(p).includes("recurringConsent"), `${p} forwards recurring consent`);
  }
  // Dashboard add-on quick-buttons collect interactive consent before checkout.
  for (const p of [
    "app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts",
    "app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts",
    "app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts",
    "app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout.ts",
    "app/lib/clasificados/autos/autosDealerInventoryBoostCheckoutClient.ts",
  ]) {
    assert.ok(read(p).includes("confirmRecurringConsentInteractively"), `${p} requires interactive consent`);
  }
}

/* 5 — Autos convergence: bypassOnly handshake; canonical path for real payments. */
{
  const legacyRoute = read("app/api/clasificados/autos/checkout/route.ts");
  assert.ok(legacyRoute.includes("bypassOnly"), "legacy route supports the convergence handshake");
  assert.ok(legacyRoute.includes("no_bypass_available"), "no-bypass returns WITHOUT creating a Stripe session");
  const confirmCore = read("app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx");
  assert.ok(confirmCore.includes("bypassOnly: true"), "confirm surface only asks legacy for bypass evaluation");
  assert.ok(confirmCore.includes("AUTOS_DEALER_CHECKOUT"), "dealer base converges to canonical Revenue OS");
  assert.ok(confirmCore.includes("autosDealerSelectedAddOns"), "boost add-on rides the canonical session");
  assert.ok(confirmCore.includes("recurringConsentChecked"), "dealer recurring consent collected on the confirm surface");
  assert.ok(confirmCore.includes("buildRecurringConsentText"), "exact disclosure rendered for the dealer subscription");
}

/* 6 — Bienes convergence + one-time truth. */
{
  const brExito = read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx");
  assert.ok(!brExito.includes('method: "POST"'), "BR success page performs no mutation requests");
  // BR Privado (FSBO) stays one-time: its checkout payload never carries recurring consent.
  const fsbo = read("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx");
  assert.ok(!fsbo.includes("recurringConsent"), "BR Privado one-time checkout has no subscription consent");
  const privadoAutos = read("app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx");
  assert.ok(!privadoAutos.includes("recurringConsent"), "Autos Privado one-time checkout has no subscription consent");
}

/* 7 — side-door boost route: role guard + consent + attempt identity. */
{
  const sideDoor = read("app/api/clasificados/autos/inventory-pack/checkout/route.ts");
  assert.ok(sideDoor.includes('role === "inventory_vehicle"'), "a child can never buy the boost against itself");
  assert.ok(sideDoor.includes("createRecurringConsentRecord"), "side-door requires consent like the canonical route");
  assert.ok(sideDoor.includes("computeCheckoutAttemptKey"), "side-door uses the purchase-attempt identity");
}

console.log("gate-pkgC-consent-convergence-selftest: all assertions passed.");
