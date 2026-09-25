/**
 * Globalization Build D-S, Gate DS4 — shared accessibility focus-trap primitive, adopted at the
 * two canonical shared overlay surfaces (never per-category).
 * Run: npx tsx scripts/verify-ds4-shared-focus-trap.ts
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
  console.log("verify-ds4-shared-focus-trap: starting");

  const hookSrc = read("app/lib/accessibility/useLeonixFocusTrap.ts");
  check("Hook traps Tab and Shift+Tab within the container", () => {
    assert.match(hookSrc, /e\.key !== "Tab"/);
    assert.match(hookSrc, /e\.shiftKey/);
  });
  check("Hook restores focus to the pre-activation element on close/unmount", () => {
    assert.match(hookSrc, /previouslyFocused\.current = document\.activeElement/);
    assert.match(hookSrc, /toRestore\.focus\(\)/);
  });

  const sheetSrc = read("app/(site)/components/mobile/LeonixMobileBottomSheet.tsx");
  check("LeonixMobileBottomSheet (Google/Yelp drawer + Community Trust surfaces) adopts the shared hook", () => {
    assert.match(sheetSrc, /import \{ useLeonixFocusTrap \} from "@\/app\/lib\/accessibility\/useLeonixFocusTrap"/);
    assert.match(sheetSrc, /useLeonixFocusTrap\(open, panelRef\)/);
  });

  const ctaSrc = read("app/components/cta/CtaActionSheet.tsx");
  check("CtaActionSheet (nearly every category's contact/CTA flow) adopts the same shared hook", () => {
    assert.match(ctaSrc, /import \{ useLeonixFocusTrap \} from "@\/app\/lib\/accessibility\/useLeonixFocusTrap"/);
    assert.match(ctaSrc, /useLeonixFocusTrap\(open, panelRef\)/);
  });
  check("CtaActionSheet's panel is a real focusable container (not just decorative)", () => {
    assert.match(ctaSrc, /ref=\{panelRef\}/);
    assert.match(ctaSrc, /tabIndex=\{-1\}/);
  });

  // ── Gate DS2-3 — 19-cell accessibility matrix reconciliation, traced by real caller path ───
  // ADOPTED_SOURCE: the category's live contact/CTA interaction routes through CtaActionSheet
  // (directly or via a shared intermediary that itself imports it), or through the shared
  // review drawer (built on LeonixMobileBottomSheet). Traced by real import, not inferred.
  const adoptedCallSites: Array<[label: string, file: string]> = [
    ["SVC — ServiciosBusinessHubContactCard.tsx", "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx"],
    ["RST — RestaurantContactHub.tsx", "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx"],
    ["CML — ComidaLocalContactActions.tsx", "app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx"],
    ["BRN — brContactCtaSheet.tsx", "app/(site)/clasificados/bienes-raices/shared/brContactCtaSheet.tsx"],
    ["RTN — RentasNegocioDesktopBusinessRail.tsx", "app/(site)/clasificados/rentas/listing/components/RentasNegocioDesktopBusinessRail.tsx"],
    ["AUP/AUD — AutosSheetCtaLink.tsx", "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx"],
    ["EMP — QuickJobCTACard.tsx", "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx"],
    ["ENV — EnVentaAnuncioLayout.tsx", "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx"],
    ["VJS — ViajesSheetCtaLink.tsx", "app/(site)/clasificados/viajes/components/ViajesSheetCtaLink.tsx"],
  ];
  for (const [label, file] of adoptedCallSites) {
    check(`ADOPTED_SOURCE traced: ${label} imports CtaActionSheet`, () => {
      const src = read(file);
      assert.match(src, /CtaActionSheet/);
    });
  }

  check("BRP/RTP route through the generic ContactActions.tsx, which itself imports CtaActionSheet", () => {
    const src = read("app/(site)/clasificados/components/ContactActions.tsx");
    assert.match(src, /CtaActionSheet/);
  });
  check("RTP additionally confirmed via LeonixCorreoLeadModal (used on the live Rentas detail page), which imports CtaActionSheet", () => {
    const src = read("app/(site)/clasificados/lib/LeonixCorreoLeadModal.tsx");
    assert.match(src, /CtaActionSheet/);
  });

  // ADAPTER_REQUIRED — real independent overlays confirmed NOT using either canonical surface.
  // Reported, not fixed (Gate DS2-3 is reconciliation, not a second build).
  check("OFL ADAPTER_REQUIRED: Ofertas Locales has independent overlays not on either canonical surface", () => {
    const files = [
      "app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx",
      "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx",
      "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx",
      "app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx",
      "app/(site)/publicar/ofertas-locales/OfertasLocalesItemDetailDrawer.tsx",
      "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx",
    ];
    for (const f of files) {
      const src = read(f);
      assert.doesNotMatch(src, /CtaActionSheet/, `${f} unexpectedly imports CtaActionSheet`);
      assert.doesNotMatch(src, /useLeonixFocusTrap/, `${f} unexpectedly already has the shared focus-trap`);
    }
  });

  check("CMD/CLS ADAPTER_REQUIRED: CommunityQuickPublishedDetailPage.tsx has its own independent Report modal (serves both clases and comunidad)", () => {
    const src = read("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx");
    assert.match(src, /category: "clases" \| "comunidad"/);
    assert.match(src, /showReportModal/);
    assert.doesNotMatch(src, /CtaActionSheet|useLeonixFocusTrap/);
  });

  check("BSC ADAPTER_REQUIRED: BuscoPublishedDetailPage.tsx has its own independent BuscoReportModal", () => {
    const src = read("app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx");
    assert.match(src, /BuscoReportModal/);
    assert.doesNotMatch(src, /CtaActionSheet|useLeonixFocusTrap/);
  });

  check("MSC N/A_WITH_REASON: Mascotas' detail page has no modal/sheet interaction at all today (nothing to trap focus in)", () => {
    const src = read("app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx");
    assert.doesNotMatch(src, /role="dialog"|CtaActionSheet|showReportModal|useLeonixFocusTrap/);
  });

  console.log(`\nverify-ds4-shared-focus-trap: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
