/**
 * Owner Command Center — True Final QA mechanical verifier.
 *
 * Certifies that every current product family has declared canonical public / owner / admin
 * identity routes in repository truth, and that the True Final QA record exists.
 * Runtime authenticated/payment/destructive cases remain in the QA markdown.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

function exists(relPath: string): boolean {
  return existsSync(path.join(ROOT, relPath));
}

function read(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

const qa = read("app/(site)/dashboard/OWNER_COMMAND_CENTER_TRUE_FINAL_QA.md");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const routes = read("app/lib/listingIdentity/categoryRouteRegistry.ts");
const resolver = read("app/lib/listingIdentity/dashboardActionResolver.ts");
const trust = read("app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx");
const adminSurface = read("app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts");
const adminQueue = read("app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx");
const autosAdmin = read("app/admin/(dashboard)/workspace/clasificados/autos/page.tsx");
const empleosAdmin = read("app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx");

check("True Final QA record exists", qa.length > 500);
check("QA record states CONTROLLING BIBLE READ", /CONTROLLING BIBLE READ:\s*YES/.test(qa));
check("QA record forbids Iglesias as current blocker", /IGLESIAS[\s\S]{0,200}FUTURE/.test(qa));

const families = [
  ["en-venta", "app/(site)/clasificados/en-venta/page.tsx", "app/(site)/clasificados/en-venta/results/page.tsx", "app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx"],
  ["autos", "app/(site)/clasificados/autos/page.tsx", "app/(site)/clasificados/autos/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx"],
  ["dealers-de-autos", "app/(site)/clasificados/dealers-de-autos/page.tsx", "app/(site)/clasificados/dealers-de-autos/results/page.tsx", "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx"],
  ["bienes-raices", "app/(site)/clasificados/bienes-raices/page.tsx", "app/(site)/clasificados/bienes-raices/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx"],
  ["rentas", "app/(site)/clasificados/rentas/page.tsx", "app/(site)/clasificados/rentas/results/page.tsx", "app/admin/(dashboard)/workspace/clasificados/rentas/page.tsx"],
  ["empleos", "app/(site)/clasificados/empleos/page.tsx", "app/(site)/clasificados/empleos/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/empleos/page.tsx"],
  ["clases", "app/(site)/clasificados/clases/page.tsx", "app/(site)/clasificados/clases/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/clases/page.tsx"],
  ["comunidad", "app/(site)/clasificados/comunidad/page.tsx", "app/(site)/clasificados/comunidad/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/comunidad/page.tsx"],
  ["busco", "app/(site)/clasificados/busco/page.tsx", "app/(site)/clasificados/busco/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/busco/page.tsx"],
  ["mascotas-y-perdidos", "app/(site)/clasificados/mascotas-y-perdidos/page.tsx", "app/(site)/clasificados/mascotas-y-perdidos/results/page.tsx", "app/admin/(dashboard)/workspace/clasificados/mascotas-y-perdidos/page.tsx"],
  ["comida-local", "app/(site)/clasificados/comida-local/page.tsx", "app/(site)/clasificados/comida-local/page.tsx", "app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx"],
  ["servicios", "app/(site)/clasificados/servicios/page.tsx", "app/(site)/clasificados/servicios/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx"],
  ["restaurantes", "app/(site)/clasificados/restaurantes/page.tsx", "app/(site)/clasificados/restaurantes/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx"],
  ["viajes", "app/(site)/clasificados/viajes/page.tsx", "app/(site)/clasificados/viajes/resultados/page.tsx", "app/admin/(dashboard)/workspace/clasificados/travel/page.tsx"],
  ["ofertas-locales", "app/(site)/clasificados/ofertas-locales/page.tsx", "app/(site)/clasificados/ofertas-locales/results/page.tsx", "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx"],
] as const;

for (const [name, landing, resultsPage, admin] of families) {
  check(`PUBLIC LANDING file exists: ${name}`, exists(landing), landing);
  check(`PUBLIC RESULTS file exists: ${name}`, exists(resultsPage), resultsPage);
  check(`ADMIN WORKSPACE file exists: ${name}`, exists(admin), admin);
}

check("PUBLIC DETAIL generic listings: /clasificados/anuncio/[id]", exists("app/(site)/clasificados/anuncio/[id]/page.tsx"));
check("PUBLIC DETAIL autos vehicle: /clasificados/autos/vehiculo/[id]", exists("app/(site)/clasificados/autos/vehiculo/[id]/page.tsx"));
check("PUBLIC DETAIL autos dealer group: /clasificados/autos/dealer/[dealerInventoryGroupId]", exists("app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx"));
check("PUBLIC DETAIL rentas listing: /clasificados/rentas/listing/[id]", exists("app/(site)/clasificados/rentas/listing/[id]/page.tsx"));
check("PUBLIC DETAIL empleos slug: /clasificados/empleos/[slug]", exists("app/(site)/clasificados/empleos/[slug]/page.tsx"));
check("PUBLIC DETAIL servicios slug", exists("app/(site)/clasificados/servicios/[slug]/page.tsx"));
check("PUBLIC DETAIL restaurantes slug", exists("app/(site)/clasificados/restaurantes/[slug]/page.tsx"));
check("PUBLIC DETAIL viajes oferta slug", exists("app/(site)/clasificados/viajes/oferta/[slug]/page.tsx"));
check("PUBLIC DETAIL ofertas id", exists("app/(site)/clasificados/ofertas-locales/[id]/page.tsx"));

check("OWNER library /dashboard/mis-anuncios", exists("app/(site)/dashboard/mis-anuncios/page.tsx"));
check("OWNER generic workspace /dashboard/mis-anuncios/[id]", exists("app/(site)/dashboard/mis-anuncios/[id]/page.tsx"));
check("OWNER generic edit /dashboard/mis-anuncios/[id]/editar", exists("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx"));
check("OWNER servicios collection", exists("app/(site)/dashboard/servicios/page.tsx"));
check("OWNER restaurantes collection", exists("app/(site)/dashboard/restaurantes/page.tsx"));
check("OWNER empleos collection+detail", exists("app/(site)/dashboard/empleos/page.tsx") && exists("app/(site)/dashboard/empleos/[listingId]/page.tsx"));
check("OWNER viajes collection", exists("app/(site)/dashboard/viajes/page.tsx"));
check("OWNER ofertas collection+detail", exists("app/(site)/dashboard/ofertas-locales/page.tsx") && exists("app/(site)/dashboard/ofertas-locales/[id]/page.tsx"));
check("OWNER account command center", exists("app/(site)/dashboard/page.tsx"));
check("OWNER business tools", exists("app/(site)/dashboard/business-tools/page.tsx"));

const utilities = [
  "drafts",
  "analytics",
  "analytics/listing",
  "mensajes",
  "notificaciones",
  "guardados",
  "busquedas-guardadas",
  "vistos-recientes",
  "perfil",
  "seguridad",
];
for (const u of utilities) {
  check(`OWNER utility /dashboard/${u}`, exists(`app/(site)/dashboard/${u}/page.tsx`));
}

check("PUBLISH empleos quick/premium/feria forms exist", exists("app/(site)/publicar/empleos/quick/page.tsx") && exists("app/(site)/publicar/empleos/premium/page.tsx") && exists("app/(site)/publicar/empleos/feria/page.tsx"));
check("PUBLISH autos privado+negocios forms exist", exists("app/(site)/publicar/autos/privado/page.tsx") && exists("app/(site)/publicar/autos/negocios/page.tsx"));
check("PUBLISH viajes negocios+privado forms exist", exists("app/(site)/publicar/viajes/negocios/page.tsx") && exists("app/(site)/publicar/viajes/privado/page.tsx"));
check("PUBLISH ofertas form+preview exist", exists("app/(site)/publicar/ofertas-locales/page.tsx") && exists("app/(site)/publicar/ofertas-locales/preview/page.tsx"));

check("REGISTRY declares autos-privado publicRoute vehicle path", /autos\/vehiculo\/\$\{/.test(routes));
check("REGISTRY declares en-venta publicRoute anuncio path", /en_venta[\s\S]{0,800}?\/clasificados\/anuncio\/\$\{identity\.sourceId\}/.test(routes) || /pipeline: "en_venta"[\s\S]{0,500}?\/clasificados\/anuncio\//.test(routes));
check("REGISTRY declares rentas results /clasificados/rentas/results", /resultsRoute: "\/clasificados\/rentas\/results"/.test(routes));
check("REGISTRY declares viajes oferta as public detail", /viajes\/oferta/.test(routes));
check("RESOLVER viewPublic uses adapter.publicRoute (identity's own public route)", /adapter\.publicRoute\(identity/.test(resolver));
check("RESOLVER omits BR child preview", /bienes_raices_negocio[\s\S]{0,80}?child/.test(resolver) && /previewSupported/.test(resolver));

check("ADMIN generic listings View public uses /clasificados/anuncio/{id} except Rentas", /\/clasificados\/anuncio\/\$\{row\.id\}/.test(adminQueue) && /rentasListingPublicPath/.test(adminQueue));
check("ADMIN autos row View public uses autosLiveVehiclePath(row id)", /autosLiveVehiclePath\(r\.id\)/.test(autosAdmin));
check("ADMIN empleos row View public uses /clasificados/empleos/{slug}", /\/clasificados\/empleos\/\$\{r\.slug\}/.test(empleosAdmin));
check("ADMIN queue header surfaces exist for specialized families", /case "servicios"/.test(adminSurface) && /case "empleos"/.test(adminSurface) && /case "autos"/.test(adminSurface) && /case "travel"/.test(adminSurface));

check("CAPABILITY registry has iglesias unsupported owner edit", /iglesias: merge\(\{[\s\S]{0,400}?edit: "unsupported"/.test(registry));
check("No /dashboard/iglesias owner workspace page", !exists("app/(site)/dashboard/iglesias/page.tsx"));
check("Prayer admin exists; no owner prayer listing workspace", exists("app/admin/(dashboard)/workspace/iglesias/prayers/page.tsx") && !exists("app/(site)/dashboard/oracion/page.tsx"));

check("Community Trust owner component is read-only", /READ ONLY/.test(trust) && !/fetch\(/.test(trust.replace(/\/\*[\s\S]*?\*\//g, "")));
check("QA record includes Public → Owner → Admin triangle section", /PUBLIC → OWNER → ADMIN|PUBLIC ENTITY/.test(qa));
check("QA record includes all required product families", ["En Venta", "Autos Privado", "Autos Dealer", "Bienes Raíces Privado", "Bienes Raíces Negocio", "Rentas Privado", "Empleos Quick", "Empleos Premium", "Empleos Feria", "Clases", "Comunidad", "Busco", "Mascotas", "Comida Local", "Servicios", "Restaurantes", "Viajes Negocios", "Viajes Privado", "Ofertas Locales"].every((s) => qa.includes(s)));

check("QA record documents SAFE runtime blocks", /SAFE PAYMENT|SAFE AUTH|SAFE DATA/.test(qa));
check("npm script verify:owner-command-center:true-final-qa registered", /"verify:owner-command-center:true-final-qa"/.test(read("package.json")));

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? ` — ${r.detail}` : "";
  console.log(`[${mark}] ${r.name}${r.pass ? "" : detail}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
