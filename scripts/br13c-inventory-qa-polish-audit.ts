/**
 * BR13C — Inventory QA polish + publish routing + Leonix Ad ID visibility audit.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function mustInclude(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`BR13C audit failed: missing ${label} (${needle})`);
  }
}

function main(): void {
  const policy = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts");
  const copy = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts");
  const app = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx");
  const contact = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/ContactoCtasNegocioSection.tsx",
  );
  const previewDraft = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft.ts",
  );
  const previewMap = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
  );
  const previewI18n = read("app/(site)/clasificados/bienes-raices/preview/bienesRaicesPreviewViewI18n.ts");
  const previewClient = read(
    "app/(site)/clasificados/bienes-raices/preview/negocio/components/BienesRaicesNegocioPreviewClient.tsx",
  );
  const dashboardActions = read(
    "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx",
  );
  const valueDrawer = read("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawer.tsx");
  const adminSelect = read("app/admin/_lib/listingsAdminSelect.ts");
  const auditDoc = read("app/(site)/clasificados/bienes-raices/BR13C_INVENTORY_QA_POLISH_AUDIT.md");

  mustInclude(copy, "Agregar propiedad al inventario", "inventory title ES");
  mustInclude(copy, "Conectada a:", "parent connected copy");
  mustInclude(dashboardActions, "brPropertyInventoryAddPropertyCtaLabel", "dashboard add CTA");
  mustInclude(copy, "Agregar propiedad", "add property label ES");
  mustInclude(policy, "399", "$399 base");
  mustInclude(policy, "99.99", "$99.99 upgrade");
  mustInclude(policy, "498.99", "$498.99 total with upgrade");
  mustInclude(valueDrawer, "BrPropertyInventoryValueDrawer", "value drawer component");
  mustInclude(dashboardActions, "BrPropertyInventoryValueDrawerTrigger", "drawer trigger on listing card");
  mustInclude(policy, "BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES = 3", "base 3");
  mustInclude(policy, "BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5", "upgrade +5");
  mustInclude(policy, "BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8", "max 8");
  mustInclude(contact, "Botones y enlaces del anuncio", "step 12 title");
  mustInclude(contact, "Ya usamos la información profesional", "step 12 helper");
  mustInclude(previewDraft, "previewDraftMemory", "media preview memory fallback");
  mustInclude(previewMap, "data:video", "local video preview path");
  mustInclude(previewI18n, "Ver ubicación", "map CTA label");
  mustInclude(previewI18n, "Más información", "more information label");
  mustInclude(previewClient, "brPropertyInventoryAddToInventoryCtaLabel", "inventory final CTA");
  mustInclude(previewClient, "Publicar anuncio", "normal publish CTA");
  mustInclude(app, "brInventoryAddModeTitle", "inventory application title");
  mustInclude(adminSelect, "br_inventory_group_id", "admin inventory columns");
  mustInclude(auditDoc, "TRUE/FALSE", "audit table");

  if (/per-property|Starter|Pro tier|Premium tier/i.test(policy + copy)) {
    throw new Error("BR13C audit failed: pricing tiers or per-property fee detected");
  }

  console.log("br13c-inventory-qa-polish-audit: OK");
}

main();
