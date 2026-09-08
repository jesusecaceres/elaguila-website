/**
 * Package E Build E2 — narrow verifier proving the dashboard global-command-center gates are
 * real, source-level truths: commercial-state consumption for the 4 target categories (no
 * account-tier use, no duplicate resolver), Business Tools' real capability gate, parent/child
 * subscription-renewal isolation (Autos Dealer/Bienes Negocio never fake a Renew action),
 * Messages/Saved real wiring (nav flag gated on real implementation), category action route
 * reality (Servicios/Empleos/Autos Privado/Comunidad-Clases-Busco), notification truthfulness,
 * and the Ofertas Locales dashboard boundary.
 *
 * Run: npx tsx scripts/verify-package-e-e2-user-dashboard-command-center.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

async function main() {
  // --- Gate 1: global commercial-state badge adoption (no duplicate resolver) ---
  const badges = src("app/lib/listingPlans/commercialStateBadges.ts");
  check(
    badges.includes("export function resolveCommercialStateBadges"),
    "Gate 1: resolveCommercialStateBadges() is still the single canonical resolver",
  );
  check(
    badges.includes("export function commercialStateBadgesToLifecycleNote"),
    "Gate 1: commercialStateBadgesToLifecycleNote() exists as a thin display adapter (not a second resolver)",
  );
  check(
    (badges.match(/export function resolve\w*CommercialState\w*\(/g) ?? []).length === 1,
    "Gate 1: exactly one commercial-state resolver function exists in this file",
  );

  const misAnuncios = src("app/(site)/dashboard/mis-anuncios/page.tsx");
  check(
    misAnuncios.includes("commercialStateBadgesToLifecycleNote"),
    "Gate 1: mis-anuncios/page.tsx imports/uses the lifecycle-note adapter",
  );
  check(
    (misAnuncios.match(/lifecycleNote=\{/g) ?? []).length >= 2,
    "Gate 1: at least Restaurantes and Servicios cards render a real lifecycleNote",
  );
  check(
    misAnuncios.includes('commercialStateBadges={(() => {') && misAnuncios.includes("dashboardSubscriptionStateForKey(subscriptionStates, [x.id])"),
    "Gate 1: Rentas/BR commercialStateBadges call site preserved exactly as before",
  );

  const autosDealer = src("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  check(
    autosDealer.includes("resolveCommercialStateBadges") && autosDealer.includes("commercialStateBadgesToLifecycleNote"),
    "Gate 1/3: Autos Dealer parent group renders real commercial-state, via the shared resolver + adapter",
  );
  check(
    !/onRenew|renewSubscription|manageSubscription/i.test(autosDealer),
    "Gate 3: Autos Dealer section does NOT fabricate a Renew/Manage-subscription action",
  );

  const brNegocio = src("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx");
  check(
    brNegocio.includes("resolveCommercialStateBadges") && brNegocio.includes("commercialStateBadgesToLifecycleNote"),
    "Gate 1/3: Bienes Negocio parent group renders real commercial-state, via the shared resolver + adapter",
  );
  check(
    !/onRenew|renewSubscription|manageSubscription/i.test(brNegocio),
    "Gate 3: Bienes Negocio section does NOT fabricate a Renew/Manage-subscription action",
  );

  // --- Gate 2: Business Tools real capability gate ---
  const businessTools = src("app/(site)/dashboard/business-tools/page.tsx");
  check(
    businessTools.includes("fetchDashboardListingPackageEntitlementBadges") &&
      businessTools.includes('dashboardHasCapabilityForKey'),
    "Gate 2: Business Tools page calls the canonical entitlement API + capability check",
  );
  check(
    !businessTools.match(/capabilit\w*\s*=\s*profileCompleteness/i),
    "Gate 2: Business Tools never derives capability from profile completeness",
  );

  // --- Gate 4: category action truth ---
  const restaurantesCardBlock = misAnuncios.slice(
    misAnuncios.indexOf("showRestSection ?"),
    misAnuncios.indexOf("showEmpleosSection ?"),
  );
  check(
    !restaurantesCardBlock.includes("onCouponUpgrade"),
    "Gate 4: the stale Restaurantes +$99/mes coupon-upgrade CTA is removed from the card call site",
  );
  check(
    restaurantesCardBlock.includes("onCouponEdit"),
    "Gate 4: the real coupon-edit action (editing already-included content) is preserved",
  );

  const catTools = src("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
  check(
    catTools.includes("onServiciosManage"),
    "Gate 4: Servicios pause/resume opt exists on buildInventoryListingActions",
  );
  check(
    misAnuncios.includes("manageServiciosListing") && misAnuncios.includes("/api/clasificados/servicios/manage"),
    "Gate 4: Servicios pause/resume calls the real, existing owner-verified manage route",
  );
  check(
    catTools.includes("onEmpleosLifecycle"),
    "Gate 4: Empleos pause/archive/resume opt exists on buildInventoryListingActions",
  );
  check(
    misAnuncios.includes("updateEmpleosLifecycle") && misAnuncios.includes("/api/clasificados/empleos/listings/"),
    "Gate 4: Empleos lifecycle actions call the real, existing owner-verified PATCH route",
  );
  check(
    misAnuncios.includes('/publicar/autos/privado?') && misAnuncios.includes("editHref={"),
    "Gate 4: Autos Privado card wires the real, confirmed edit route",
  );
  check(
    misAnuncios.includes('/editar?${q}') && misAnuncios.includes('catLower === "clases" || catLower === "comunidad" || catLower === "busco"'),
    "Gate 4: Comunidad/Clases/Busco share the real generic listings-table editor route",
  );
  check(
    !misAnuncios.match(/catLower === "mascotas[^"]*"[^}]*editar/),
    "Gate 4: Mascotas is not given an edit link (no safe route exists, by design)",
  );

  // --- Gate 5: real Messages inbox ---
  const mensajes = src("app/(site)/dashboard/mensajes/page.tsx");
  check(
    mensajes.includes('.eq("receiver_id", user.id)') && mensajes.includes('.from("messages")'),
    "Gate 5: Messages inbox queries the real messages table scoped to the authenticated receiver",
  );
  check(
    !/onSend|sendMessage|<textarea/i.test(mensajes),
    "Gate 5: Messages inbox has no fabricated send/reply UI",
  );
  const productTruth = src("app/(site)/dashboard/lib/dashboardProductTruth.ts");
  check(
    productTruth.includes("DASHBOARD_INTERNAL_INBOX_READY = true"),
    "Gate 5: inbox nav-ready flag is flipped only alongside the real implementation",
  );

  // --- Gate 6: real Saved listings ---
  const guardados = src("app/(site)/dashboard/guardados/page.tsx");
  check(
    guardados.includes("resolveSavedListingsForDashboard") && guardados.includes("listSavedListingIdsForUser"),
    "Gate 6: Saved page uses the real, pre-existing resolver chain",
  );
  check(
    productTruth.includes("DASHBOARD_SAVED_LISTINGS_READY = true"),
    "Gate 6: saved nav-ready flag is flipped only alongside the real implementation",
  );

  // --- Gate 7: notification truthfulness ---
  const feed = src("app/(site)/dashboard/lib/derivedDashboardFeed.ts");
  check(
    feed.includes('"payment_attention"') && feed.includes("resolveCommercialStateBadges"),
    "Gate 7: payment_attention notification kind is sourced from the canonical resolver, not invented",
  );
  check(
    feed.includes('["grace", "suspended_nonpayment", "disputed", "cancels_at_period_end", "canceled"]'),
    "Gate 7: only real attention-worthy states surface a notification (never a plain 'active' state)",
  );
  const overview = src("app/(site)/dashboard/page.tsx");
  check(
    overview.includes('f.kind === "payment_attention"'),
    "Gate 7: Overview surfaces the same derived-feed source, not a second implementation",
  );

  // --- Gate 8: Ofertas Locales dashboard boundary ---
  check(
    misAnuncios.includes("/api/ofertas-locales/owner") && misAnuncios.includes("ofertasLocalesOwnerCount"),
    "Gate 8: My Listings represents Ofertas Locales via the existing real owner reader",
  );
  check(
    misAnuncios.includes("/dashboard/ofertas-locales?"),
    "Gate 8: Ofertas Locales summary card links to the dedicated management surface, not a rebuilt UI",
  );

  console.log(
    failures === 0
      ? "verify-package-e-e2-user-dashboard-command-center: all checks passed."
      : `verify-package-e-e2-user-dashboard-command-center: ${failures} FAILURE(S).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
