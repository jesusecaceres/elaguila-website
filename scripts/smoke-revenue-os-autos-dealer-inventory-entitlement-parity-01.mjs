import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const pricing = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const helper = read("app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const route = read("app/api/revenue-os/checkout/route.ts");
const fulfillment = read("app/lib/listingPlans/revenueAutosDealerFulfillment.ts");
const dashboard = read("app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts");

const scenarios = [
  {
    name: "new dealer base only",
    ok:
      pricing.includes('packageKey: "autos_dealer_monthly"') &&
      pricing.includes("priceCents: 39900") &&
      helper.includes("autosDealerSelectedAddOns") &&
      route.includes("AUTOS_DEALER_MONTHLY_PACKAGE_KEY"),
  },
  {
    name: "new dealer base plus inventory",
    ok:
      pricing.includes('packageKey: "autos_dealer_inventory_pack_monthly"') &&
      pricing.includes("priceCents: 12900") &&
      checkout.includes("allowedKeys: [AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY]") &&
      fulfillment.includes("grantAutosDealerInventoryPackAddOn"),
  },
  {
    name: "existing dealer upgrade add-on only",
    ok:
      dashboard.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT") &&
      checkout.includes("listingId is required for Autos dealer inventory add-on checkout") &&
      !dashboard.includes("AUTOS_DEALER_CHECKOUT"),
  },
  {
    name: "cancel checkout remains inactive",
    ok: route.includes("buildCheckoutCancelUrl") && !fulfillment.includes("checkout.session.expired"),
  },
  {
    name: "Autos Privado has no dealer inventory",
    ok: checkout.includes('lane !== "negocios"') || checkout.includes("listing_not_dealer"),
  },
];

const failed = scenarios.filter((s) => !s.ok);
for (const s of scenarios) console.log(`${s.ok ? "PASS" : "FAIL"} ${s.name}`);
if (failed.length) {
  console.error(`\n${failed.length} smoke scenarios failed static checks.`);
  process.exit(1);
}
console.log("\nAutos dealer Revenue OS smoke scenarios passed static checks.");
