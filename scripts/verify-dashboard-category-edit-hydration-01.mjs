import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

function assert(condition, message) {
  if (!condition) {
    console.error(`verify-dashboard-category-edit-hydration-01: FAIL - ${message}`);
    process.exit(1);
  }
}

const dashboardTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const dashboardInventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
const actionContract = read("app/(site)/dashboard/lib/categoryDashboardActionContract.ts");
const serviciosApp = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const mapper = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
const ownerApi = read("app/api/clasificados/servicios/my-listing/route.ts");
const serviciosDashboard = read("app/(site)/dashboard/servicios/page.tsx");
const draftsDashboard = read("app/(site)/dashboard/drafts/page.tsx");
const packageJson = JSON.parse(read("package.json"));

const dashboardSources = [
  dashboardTools,
  dashboardInventory,
  serviciosDashboard,
  draftsDashboard,
  read("app/(site)/dashboard/components/DashboardCategoryListingCard.tsx"),
  read("app/(site)/dashboard/components/DashboardListingActionBar.tsx"),
].join("\n");

assert(!dashboardSources.includes("Open panel"), "dashboard/category listing actions still include Open panel");
assert(!dashboardSources.includes("Continue editing"), "dashboard/category listing actions still include Continue editing");
assert(dashboardTools.includes("Manage ad") && dashboardTools.includes("Edit listing"), "clear owner-facing labels missing");

assert(exists("app/(site)/dashboard/lib/categoryDashboardActionContract.ts"), "shared category dashboard action contract missing");
assert(actionContract.includes("CategoryDashboardActionContract"), "CategoryDashboardActionContract type missing");
assert(actionContract.includes("buildServiciosDashboardActionContract"), "Servicios contract builder missing");
assert(actionContract.includes("listingSlug") && actionContract.includes("leonixAdId"), "Servicios edit URL lacks listing identity");

assert(dashboardInventory.includes("actionContract") && dashboardInventory.includes("buildServiciosDashboardActionContract"), "dashboard inventory does not use shared contract");
assert(dashboardInventory.includes("editHref: actionContract.editUrl"), "Servicios dashboard editHref is not contract edit URL");

assert(mapper.includes("serviciosPublishedToApplicationDraft"), "Servicios published-to-form mapper missing");
assert(mapper.includes("profile_json") && mapper.includes("leonix_ad_id"), "mapper does not accept published row identity");
assert(mapper.includes("paymentMethods") && mapper.includes("amenityOptions") && mapper.includes("credentials"), "new-fields indicator foundation missing");

assert(serviciosApp.includes('searchParams?.get("edit")'), "Servicios form does not read edit mode param");
assert(serviciosApp.includes('searchParams?.get("listingSlug")'), "Servicios form does not read listing slug param");
assert(serviciosApp.includes("serviciosPublishedToApplicationDraft"), "Servicios form does not use hydration mapper");
assert(serviciosApp.includes("primeServiciosExistingPublicSlug"), "Servicios form does not preserve existing slug for publish updates");
assert(serviciosApp.includes("Editing published listing") && serviciosApp.includes("Leonix Ad ID"), "edit mode indicator missing");
assert(serviciosApp.includes("New fields available"), "new-fields available indicator missing");

assert(ownerApi.includes("owner_user_id") && ownerApi.includes("profile_json"), "owner listing API does not scope and return profile_json");
assert(ownerApi.includes("auth.getUser") && ownerApi.includes("Bearer"), "owner listing API does not validate bearer session");

assert(serviciosDashboard.includes("serviciosEditHref") && serviciosDashboard.includes('edit: "Edit listing"'), "Servicios dashboard edit link/label not updated");

const migrationDir = path.join(root, "supabase", "migrations");
const migrationFiles = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir) : [];
assert(
  !migrationFiles.some((name) => /dashboard-category-edit-hydration|servicios.*edit.*hydration/i.test(name)),
  "migration file appears to have been added for this no-schema gate",
);

assert(
  packageJson.scripts?.["verify:dashboard-category-edit-hydration-01"] ===
    "node scripts/verify-dashboard-category-edit-hydration-01.mjs",
  "package script verify:dashboard-category-edit-hydration-01 missing",
);

console.log("verify-dashboard-category-edit-hydration-01: PASS");
