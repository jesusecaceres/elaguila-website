/**
 * Gate R12 — Public anuncio route must use approved En Venta detail shell
 * Run: npm run en-venta:r12-public-detail-shell-smoke-test
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];
function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const anuncio = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
const route = read("app/(site)/clasificados/en-venta/contracts/enVentaAnuncioRoute.ts");
const layout = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
const preview = read("app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx");
const pkg = read("package.json");

add("Route detector exists", exists("app/(site)/clasificados/en-venta/contracts/enVentaAnuncioRoute.ts"), "enVentaAnuncioRoute.ts");
add("SALE ad id detection", route.includes("isLeonixSaleListingAdId"), "enVentaAnuncioRoute.ts");
add("Machine pair detection", route.includes("Leonix:evDept"), "enVentaAnuncioRoute.ts");
add("Anuncio uses route detector", anuncio.includes("shouldUseEnVentaPublishedDetailShell"), "page.tsx");
add("Anuncio branches useEnVentaPublishedDetail", anuncio.includes("useEnVentaPublishedDetail"), "page.tsx");
add("Anuncio renders EnVentaAnuncioLayout for En Venta", anuncio.includes("EnVentaAnuncioLayout"), "page.tsx");
add("Published row passed for En Venta", anuncio.includes("publishedSourceRow={useEnVentaPublishedDetail"), "page.tsx");
add("Layout uses EnVentaPreviewGallery for Varios", layout.includes("EnVentaPreviewGallery") && layout.includes("variosGalleryProps"), "EnVentaAnuncioLayout.tsx");
add("Layout uses listingCanvas", layout.includes("EN_VENTA_SURFACE.listingCanvas"), "EnVentaAnuncioLayout.tsx");
add("Layout uses preview-equivalent viewport padding", layout.includes("py-6") && layout.includes("lg:pt-24"), "EnVentaAnuncioLayout.tsx");
add("Layout uses EnVentaBuyerPanel for Varios", layout.includes('surface === "en-venta" && !premiumBr') && layout.includes("EnVentaBuyerPanel"), "EnVentaAnuncioLayout.tsx");
add("Varios not on legacy max-w-6xl gray shell in layout", !layout.includes("bg-[#D9D9D9] min-h-screen") || layout.includes('surface === "en-venta"'), "EnVentaAnuncioLayout.tsx");
add("Preview still uses EnVentaPreviewGallery", preview.includes("EnVentaPreviewGallery"), "EnVentaPreviewPage.tsx");
add("No hardcoded test listing id", !anuncio.includes("f9dc7c3a-c50c-4bcc-9c91-e6f0518baa5e"), "page.tsx");
add("No fake image URL", !anuncio.includes("https://example.com/"), "page.tsx");
add("npm script", pkg.includes("en-venta:r12-public-detail-shell-smoke-test"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate R12 — Public detail shell smoke test\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  for (const f of failed) console.error(`- ${f.requirement}`);
  process.exit(1);
}
