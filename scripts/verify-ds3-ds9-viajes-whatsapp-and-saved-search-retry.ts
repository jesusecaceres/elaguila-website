/**
 * Globalization Build D-S — Gate DS3 (Viajes WhatsApp root cleanup) + Gate DS9 (Saved Search
 * failed-delivery retry processor).
 * Run: npx tsx scripts/verify-ds3-ds9-viajes-whatsapp-and-saved-search-retry.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-ds3-ds9-viajes-whatsapp-and-saved-search-retry: starting");

  // ── DS3: Viajes WhatsApp ───────────────────────────────────────────────────────────────────
  const card = read("app/(site)/clasificados/viajes/components/ViajesResultsBusinessCard.tsx");
  check("ViajesResultsBusinessCard uses the shared international WhatsApp builder", () => {
    assert.match(card, /buildInternationalWhatsAppWaMeHref\(row\.whatsapp\)/);
  });

  const channels = read("app/(site)/publicar/viajes/lib/viajesContactChannelsFromDraft.ts");
  check("viajesContactChannelsFromDraft's 2 (negocios+privado) builders both use the shared function", () => {
    const matches = channels.match(/buildInternationalWhatsAppWaMeHref\(w\)/g) ?? [];
    assert.equal(matches.length, 2, `expected 2 call sites, found ${matches.length}`);
  });

  const negocios = read("app/(site)/publicar/viajes/negocios/lib/mapViajesNegociosDraftToOffer.ts");
  check("mapViajesNegociosDraftToOffer's waMeHref uses the shared function", () => {
    assert.match(negocios, /return buildInternationalWhatsAppWaMeHref\(w\);/);
  });

  const privado = read("app/(site)/publicar/viajes/privado/lib/mapViajesPrivadoDraftToOffer.ts");
  check("mapViajesPrivadoDraftToOffer's waMeHref uses the shared function", () => {
    assert.match(privado, /return buildInternationalWhatsAppWaMeHref\(w\);/);
  });
  check("mapViajesPrivadoDraftToOffer keeps digitsOnly for the unrelated tel: helper (no unrelated Viajes change)", () => {
    assert.match(privado, /function digitsOnly\(s: string\)/);
    assert.match(privado, /function telHrefFrom/);
  });

  // ── DS9: Saved Search retry processor ──────────────────────────────────────────────────────
  const delivery = read("app/lib/saved-search/delivery/savedSearchEmailDelivery.ts");
  check("retryFailedSavedSearchMatchEvents reuses the existing atomic claim + deliver path (no parallel engine)", () => {
    assert.match(delivery, /export async function retryFailedSavedSearchMatchEvents/);
    assert.match(delivery, /await claimOneMatchEvent\(supabase, eventId\)/);
    assert.match(delivery, /await deliverClaimedEvent\(supabase, claimed\)/);
  });
  check("Retry query only selects rows still eligible (status pending/failed, under the attempt bound)", () => {
    assert.match(delivery, /\.in\("status", \["pending", "failed"\]\)/);
    assert.match(delivery, /\.lt\("attempt_count", SAVED_SEARCH_EMAIL_MAX_ATTEMPTS\)/);
  });

  const route = read("app/api/saved-search/admin/retry-failed-deliveries/route.ts");
  check("Retry endpoint requires admin session OR the existing machine sweep key (no new secret invented)", () => {
    assert.match(route, /requireLeonixAdminPermission\("can_view_payments"\)/);
    assert.match(route, /LEONIX_SUBSCRIPTION_SWEEP_KEY/);
    assert.match(route, /timingSafeEqual/);
  });
  check("Retry endpoint rejects unauthorized requests", () => {
    assert.match(route, /status: 401/);
  });

  console.log(
    `\nverify-ds3-ds9-viajes-whatsapp-and-saved-search-retry: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) process.exitCode = 1;
}

main();
