/**
 * BR13D — Property Inventory value drawer + $99.99 upgrade pricing audit.
 * Run: npm run br:13d-property-inventory-value-drawer-audit
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function mustInclude(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`BR13D audit failed: missing ${label} (${needle})`);
  }
}

function mustExclude(haystack: string, needle: string, label: string): void {
  if (haystack.includes(needle)) {
    throw new Error(`BR13D audit failed: forbidden ${label} (${needle})`);
  }
}

function main(): void {
  const policy = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts");
  const copy = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy.ts");
  const drawer = read("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawer.tsx");
  const trigger = read("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawerTrigger.tsx");
  const dashboard = read("app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx");
  const listingActions = read("app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx");
  const addFlow = read("app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts");
  const auditDoc = read("app/(site)/clasificados/bienes-raices/BR13D_PROPERTY_INVENTORY_VALUE_DRAWER_AUDIT.md");

  const activeInventory = policy + copy + drawer + trigger + dashboard + listingActions;

  mustInclude(policy, "BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE = 99.99", "$99.99 upgrade constant");
  mustInclude(policy, "BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE = 498.99", "$498.99 total constant");
  mustInclude(policy, "BASE_BR_NEGOCIO_MONTHLY_PRICE = 399", "$399 base");
  mustInclude(policy, "BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES = 3", "3 active base");
  mustInclude(policy, "BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT = 5", "+5 additional");
  mustInclude(policy, "BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT = 8", "8 total");

  mustExclude(activeInventory, "89.99", "$89.99 in active BR inventory copy/constants");
  mustExclude(activeInventory, "488.99", "$488.99 in active BR inventory copy/constants");

  mustInclude(copy, "catálogo profesional", "catalog value ES");
  mustInclude(copy, "professional catalog", "catalog value EN");
  mustInclude(copy, "ID Leonix", "own Leonix ID copy");
  mustInclude(copy, "página pública", "own public page ES");
  mustInclude(drawer, "BrPropertyInventoryValueDrawer", "drawer component");
  mustInclude(drawer, "lg:ml-auto", "desktop right slide-over");
  mustInclude(drawer, "w-full", "mobile full-width drawer");
  mustInclude(drawer, "router.push", "same-tab continue (no window.open)");
  mustInclude(trigger, "BrPropertyInventoryValueDrawerTrigger", "drawer trigger");
  mustInclude(dashboard, "BrPropertyInventoryValueDrawerTrigger", "dashboard opens drawer");
  mustInclude(listingActions, "BrPropertyInventoryValueDrawerTrigger", "listing card opens drawer");

  mustInclude(addFlow, "inventoryMode", "inventoryMode=add");
  mustInclude(addFlow, "parentListingId", "parentListingId preserved");
  mustInclude(addFlow, "inventoryGroupId", "inventoryGroupId preserved");
  mustInclude(addFlow, "returnToListingId", "returnToListingId preserved");
  mustInclude(copy, "Agregar al inventario", "final add to inventory CTA ES");

  mustInclude(listingActions, "ID Leonix", "dashboard Leonix Ad ID");
  mustInclude(listingActions, "Propiedad de inventario", "inventory child label ES");

  if (/stripe\.com|checkout\.sessions|payment_intent/i.test(activeInventory)) {
    throw new Error("BR13D audit failed: Stripe wiring invented in inventory UI");
  }
  if (/\bwindow\.open\s*\(/.test(drawer + trigger)) {
    throw new Error("BR13D audit failed: drawer opens new window");
  }
  if (/per[-\s]?property\s+(fee|price|pricing)|per[-\s]?listing\s+fee/i.test(activeInventory)) {
    throw new Error("BR13D audit failed: per-property pricing detected");
  }
  if (/\b(Starter|Pro|Premium)\s+(tier|plan|package)\b/i.test(activeInventory)) {
    throw new Error("BR13D audit failed: pricing tiers detected");
  }

  mustInclude(auditDoc, "TRUE/FALSE", "audit TRUE/FALSE table");
  mustInclude(auditDoc, "99.99", "audit doc $99.99");
  mustInclude(auditDoc, "498.99", "audit doc $498.99");

  console.log("br13d-property-inventory-value-drawer-audit: OK");
}

main();
