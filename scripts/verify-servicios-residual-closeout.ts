/**
 * SERVICIOS RESIDUAL CLOSEOUT — focused proof (2026-09-16).
 *
 * Three independent owner-QA residuals, closed in one pass, none touching the Stripe engine:
 *
 *   Gate 1 — checkout newsletter identity. The email row on Servicios checkout used to be
 *     editable and, worse, the capture call PREFERRED the edited value over the authenticated
 *     session email. Now: the row is read-only (display only, no onNewsletterEmailChange wired),
 *     the capture call sends the access token, and the server resolves the canonical account
 *     email from that token itself — never trusting a client-supplied alternate for an
 *     authenticated call. Newsletter capture failure stays non-blocking to payment (unchanged).
 *
 *   Gate 5 — Servicios Correo. The primary "Correo" quote CTA used the bespoke ContactEmailMenu
 *     dropdown (or a bare mailto: navigation as fallback); now it opens the same shared
 *     CtaActionSheet send_email primitive Restaurantes/Comida Local already use, via the
 *     already-existing (previously unwired here) buildServiciosSendEmailIntentFromMailto helper.
 *
 *   Gate 6 — special hours / holidays. Every stage of the pipeline (application state → draft →
 *     BusinessProfile → sanitize → publish → dashboard-edit hydration) already carried
 *     specialHoursRows correctly; the actual gap was that ServiciosBusinessHubContactCard — the
 *     component the Preview/published shells route rendering to whenever a weekly schedule
 *     exists — never read specialHoursRows at all, so an owner with both a weekly schedule and
 *     holiday rows only ever saw the weekly one.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-residual-closeout.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ==============================================================================================
 * Gate 1 — checkout newsletter email cannot override authenticated identity.
 * ============================================================================================ */
check("newsletter checkout-capture route resolves canonical email from the bearer token and never trusts a client email when a token is present", () => {
  const route = raw("app/api/newsletter/checkout-capture/route.ts");
  assert.ok(route.includes('import { getVerifiedBearerUser } from "@/app/api/_lib/verifiedBearerUser";'));
  const verifiedIdx = route.indexOf("const verifiedUser = await getVerifiedBearerUser(req);");
  assert.ok(verifiedIdx > 0, "bearer identity is resolved server-side");
  const emailIdx = route.indexOf("const email = authenticatedEmail ?? normalizeLeadEmail(String(o.email ?? \"\"));");
  assert.ok(emailIdx > verifiedIdx, "authenticatedEmail wins over the body email — client email is only a fallback for callers with no token");
  assert.ok(
    route.includes('return NextResponse.json({ status: "FAILED", reason: "canonical_email_unavailable" });'),
    "a token that doesn't resolve to a real account email fails the capture rather than falling back to the body email",
  );
});
check("checkoutNewsletterCapture client helper sends the access token as a Bearer header when supplied", () => {
  const helper = raw("app/lib/newsletter/checkoutNewsletterCapture.ts");
  assert.ok(helper.includes("accessToken?: string | null;"), "input type accepts an access token");
  assert.ok(helper.includes("Authorization: `Bearer ${accessToken}`"), "sent as a real Authorization header");
});
check("Servicios checkout: the newsletter email row is read-only (no onNewsletterEmailChange) and the capture call uses the authenticated session email + access token, never the old editable-field preference", () => {
  const client = raw("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  assert.ok(!client.includes("onNewsletterEmailChange={setNewsletterEmail}"), "editable wiring removed — PublishCheckoutCheckpoint renders read-only text without this prop");
  assert.ok(client.includes("newsletterEmail={newsletterEmail}"), "the resolved session email is still shown to the owner before they check the box");
  assert.ok(
    !client.includes("const captureEmail = newsletterEmail.trim() || customerEmail;"),
    "the old editable-field-wins preference is gone",
  );
  assert.ok(client.includes("email: customerEmail,") && client.includes("accessToken,"), "capture now sends the authenticated session email + token, not a user-typed alternate");
});
check("newsletter capture failure stays non-blocking: checkout proceeds regardless of captureResult status", () => {
  const client = raw("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  const captureIdx = client.indexOf("const captureResult = await capturePromise;");
  const pendingCheckIdx = client.indexOf("if (!pending.ok) {");
  const checkoutCallIdx = client.indexOf("const checkout = await startRevenueCategoryCheckout({");
  assert.ok(captureIdx > 0 && pendingCheckIdx > captureIdx && checkoutCallIdx > pendingCheckIdx, "capture result is observed (for the inline note) but never gates the pending-save or checkout calls");
  assert.ok(
    !/if\s*\(\s*captureResult\.status\s*===\s*"FAILED"\s*\)\s*\{\s*(?:setCheckoutErr|return)/.test(client),
    "a FAILED capture never sets the checkout error or returns early",
  );
});

/* ==============================================================================================
 * Gate 5 — Servicios Correo consumes the shared proven email action primitive.
 * ============================================================================================ */
check("ServiciosBusinessHubContactCard's primary Correo CTA opens the shared CtaActionSheet send_email intent, not the bespoke ContactEmailMenu or a bare mailto navigation", () => {
  const card = raw("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert.ok(!card.includes('import { ContactEmailMenu } from "@/app/components/contact/ContactEmailMenu";'), "bespoke Servicios-only email drawer import removed");
  assert.ok(!card.includes("<ContactEmailMenu"), "no longer mounted");
  assert.ok(
    card.includes('import {\n  buildServiciosSendEmailIntentFromMailto,'),
    "reuses the existing (previously unwired) Servicios helper that builds the shared intent shape",
  );
  assert.ok(card.includes("const openPrimaryMailtoSheet = () => {"));
  assert.ok(
    card.includes("const intent = buildServiciosSendEmailIntentFromMailto(primaryMailto, lang, listingSlug, listingShareUrl);"),
    "same shared-intent builder already proven for the grid email chip / Restaurantes / Comida Local",
  );
  assert.ok(card.includes("if (intent) setEmailSheetIntent(intent);"), "reuses the existing CtaActionSheet state — no second sheet/drawer created");
  assert.ok(card.includes("<CtaActionSheet"), "the shared sheet primitive is still mounted");
  assert.ok(
    card.includes('quote?.kind === "mailto" && primaryMailto ?'),
    "the CTA still only renders when a real resolved email/quote destination exists",
  );
});
check("Preview stays safe: listingShareUrl is never passed by the Preview mount, matching the existing Share-button no-leaked-URL pattern", () => {
  const preview = raw("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
  const mountIdx = preview.indexOf("<ServiciosBusinessHubContactCard");
  assert.ok(mountIdx > 0);
  const mountBlock = preview.slice(mountIdx, mountIdx + 600);
  assert.ok(!mountBlock.includes("listingShareUrl="), "Preview passes no canonical share URL into the contact card, same as the proven Share-button pattern");
});
check("General Share and Cotización are untouched by the Correo change", () => {
  const card = raw("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert.ok(card.includes("const openPrimaryQuote = () => {"), "SMS/WhatsApp quote path unchanged");
  assert.ok(card.includes("ServiciosBusinessHubEngagementRow"), "share/engagement row still mounted, untouched");
});

/* ==============================================================================================
 * Gate 6 — special hours / holidays round-trip.
 * ============================================================================================ */
check("ServiciosBusinessHubContactCard renders specialHoursRows in its Horarios section (the actual broken boundary — every upstream mapper already carried this data correctly)", () => {
  const card = raw("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert.ok(card.includes("hours?.specialHoursRows?.length"), "hasHours/showHours account for special-hours-only businesses");
  const sectionIdx = card.indexOf('aria-labelledby="hub-hours-heading"');
  assert.ok(sectionIdx > 0);
  const sectionBlock = card.slice(sectionIdx, sectionIdx + 3000);
  assert.ok(sectionBlock.includes("hours.specialHoursRows && hours.specialHoursRows.length > 0"), "special-hours block is rendered inside the same Hours section as the weekly schedule");
  assert.ok(sectionBlock.includes("{labels.specialHours}"), "uses the localized header, not a hardcoded string");
  assert.ok(sectionBlock.includes("{row.label}") && sectionBlock.includes("{row.note}"), "same {label, note} shape ServiciosHours.tsx already renders");
});
check("special-hours header localizes correctly (ES/EN) and matches the copy already established in serviciosProfileCopy.ts / ServiciosHours.tsx", () => {
  const card = raw("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert.ok(card.includes('specialHours: lang === "en" ? "Special hours / Holidays" : "Horarios especiales / Días festivos",'));
  const copy = raw("app/(site)/servicios/copy/serviciosProfileCopy.ts");
  assert.ok(copy.includes('"Special hours / Holidays"') && copy.includes('"Horarios especiales / Días festivos"'), "matches the existing ServiciosHours.tsx copy key exactly — no divergent second copy source");
});
check("application -> draft -> BusinessProfile -> sanitize pipeline still carries specialHoursRows (unbroken; locked against regression)", () => {
  const toDraft = raw("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
  assert.ok(toDraft.includes("const specialHoursRows = (state.specialHoursEntries ?? [])"));
  assert.ok(toDraft.includes("contact.specialHoursRows = specialHoursRows;"));
  const toProfile = raw("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
  assert.ok(toProfile.includes("const specialHoursWire = (draft.contact?.specialHoursRows ?? [])"));
  assert.ok(toProfile.includes("specialHoursRows: specialHoursWire"));
});
check("published -> dashboard edit hydration still carries specialHoursRows back into specialHoursEntries (unbroken; locked against regression)", () => {
  const hydration = raw("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
  assert.ok(hydration.includes("specialHoursEntries: mapSpecialHours(contact.hours?.specialHoursRows),"));
});
check("weekly Open/Closed status computation is untouched by the special-hours render fix", () => {
  const card = raw("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  assert.ok(card.includes("hours.openNowLabel") && card.includes("hours.todayHoursLine"), "today/open-now pill logic unchanged");
  assert.ok(card.includes("hours.weeklyRows.map((r, i) =>"), "weekly rows render exactly as before");
});

if (failures.length) {
  console.error(`\nverify-servicios-residual-closeout: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-residual-closeout: PASS");
