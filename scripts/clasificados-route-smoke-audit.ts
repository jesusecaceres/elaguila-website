/**
 * CLASIFICADOS-NEGOCIOS-CROSSROUTE-SLOW-DOUBLECLICK-AUDIT-V1
 *
 * Lightweight route inventory + manual timing guide.
 * Run: npx tsx scripts/clasificados-route-smoke-audit.ts
 * Optional base URL: BASE_URL=http://localhost:3000 npx tsx scripts/clasificados-route-smoke-audit.ts
 */

const BASE = process.env.BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const LANG = process.env.SMOKE_LANG ?? "es";

type RouteEntry = {
  category: string;
  surface: "landing" | "results" | "alias" | "publish" | "hub" | "negocios-lane";
  path: string;
  slowRisk: "low" | "medium" | "high";
  firstClickRisk: "low" | "medium";
  notes?: string;
};

const ROUTES: RouteEntry[] = [
  { category: "hub", surface: "hub", path: "/clasificados", slowRisk: "low", firstClickRisk: "low" },
  { category: "en-venta", surface: "landing", path: "/clasificados/en-venta", slowRisk: "medium", firstClickRisk: "low", notes: "Landing preview capped at 24 rows (was 800 SSR)" },
  { category: "en-venta", surface: "results", path: "/clasificados/en-venta/results", slowRisk: "high", firstClickRisk: "low", notes: "Client fetch up to 800 listings" },
  { category: "rentas", surface: "landing", path: "/clasificados/rentas", slowRisk: "low", firstClickRisk: "low", notes: "Dead SSR browse fetch removed" },
  { category: "rentas", surface: "results", path: "/clasificados/rentas/results", slowRisk: "high", firstClickRisk: "low", notes: "SSR fetch cap 5000 + entitlement overlay" },
  { category: "empleos", surface: "landing", path: "/clasificados/empleos", slowRisk: "medium", firstClickRisk: "low" },
  { category: "empleos", surface: "results", path: "/clasificados/empleos/results", slowRisk: "medium", firstClickRisk: "low", notes: "Re-exports resultados" },
  { category: "empleos", surface: "alias", path: "/clasificados/empleos/resultados", slowRisk: "medium", firstClickRisk: "low" },
  { category: "autos", surface: "landing", path: "/clasificados/autos", slowRisk: "low", firstClickRisk: "low" },
  { category: "autos", surface: "results", path: "/clasificados/autos/results", slowRisk: "medium", firstClickRisk: "low" },
  { category: "autos", surface: "alias", path: "/clasificados/autos/resultados?seller=dealer", slowRisk: "medium", firstClickRisk: "low", notes: "Negocios Locales autos-dealer lane" },
  { category: "bienes-raices", surface: "landing", path: "/clasificados/bienes-raices", slowRisk: "low", firstClickRisk: "low" },
  { category: "bienes-raices", surface: "results", path: "/clasificados/bienes-raices/results", slowRisk: "medium", firstClickRisk: "low" },
  { category: "servicios", surface: "landing", path: "/clasificados/servicios", slowRisk: "medium", firstClickRisk: "low", notes: "SSR discovery fetch 200 rows" },
  { category: "servicios", surface: "results", path: "/clasificados/servicios/results", slowRisk: "high", firstClickRisk: "low", notes: "Alias → resultados; SSR 500 rows" },
  { category: "restaurantes", surface: "landing", path: "/clasificados/restaurantes", slowRisk: "medium", firstClickRisk: "low" },
  { category: "restaurantes", surface: "results", path: "/clasificados/restaurantes/results", slowRisk: "medium", firstClickRisk: "low" },
  { category: "viajes", surface: "landing", path: "/clasificados/viajes", slowRisk: "medium", firstClickRisk: "low" },
  { category: "viajes", surface: "results", path: "/clasificados/viajes/results", slowRisk: "medium", firstClickRisk: "low" },
  { category: "clases", surface: "landing", path: "/clasificados/clases", slowRisk: "low", firstClickRisk: "low", notes: "Client landing + client-side recent fetch" },
  { category: "clases", surface: "results", path: "/clasificados/clases/results", slowRisk: "low", firstClickRisk: "low" },
  { category: "comunidad", surface: "landing", path: "/clasificados/comunidad", slowRisk: "low", firstClickRisk: "low" },
  { category: "comunidad", surface: "results", path: "/clasificados/comunidad/results", slowRisk: "low", firstClickRisk: "low" },
  { category: "busco", surface: "landing", path: "/clasificados/busco", slowRisk: "low", firstClickRisk: "low" },
  { category: "busco", surface: "results", path: "/clasificados/busco/results", slowRisk: "low", firstClickRisk: "low" },
  { category: "mascotas-y-perdidos", surface: "landing", path: "/clasificados/mascotas-y-perdidos", slowRisk: "low", firstClickRisk: "low" },
  { category: "mascotas-y-perdidos", surface: "results", path: "/clasificados/mascotas-y-perdidos/results", slowRisk: "low", firstClickRisk: "low" },
  { category: "ofertas-locales", surface: "landing", path: "/clasificados/ofertas-locales", slowRisk: "medium", firstClickRisk: "low" },
  { category: "ofertas-locales", surface: "results", path: "/clasificados/ofertas-locales/results", slowRisk: "medium", firstClickRisk: "low" },
  { category: "comida-local", surface: "landing", path: "/clasificados/comida-local", slowRisk: "medium", firstClickRisk: "low", notes: "SSR listing query on landing" },
  { category: "negocios-locales", surface: "hub", path: "/negocios-locales", slowRisk: "low", firstClickRisk: "low" },
];

function withLang(path: string): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  if (base.includes("lang=")) return path;
  const withParam = `${base}${joiner}lang=${LANG}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

function printGuide(): void {
  console.log("\n=== Clasificados + Negocios Locales route smoke audit ===\n");
  console.log(`Base URL: ${BASE}`);
  console.log(`Lang param: ${LANG}\n`);
  console.log("MANUAL QA — for each route:");
  console.log("  1. Single click from hub or Negocios Locales lane card → page opens (no second click).");
  console.log("  2. Network tab: TTFB / document should not block >3s on landing (local dev).");
  console.log("  3. Results pages may be heavier — confirm shell appears before full grid.");
  console.log("  4. Compare fast (clases/comunidad) vs slow suspects (rentas/results, servicios/resultados).\n");

  console.log("| Category | Surface | URL | Slow | Click | Notes |");
  console.log("|----------|---------|-----|------|-------|-------|");
  for (const r of ROUTES) {
    const url = `${BASE}${withLang(r.path)}`;
    console.log(`| ${r.category} | ${r.surface} | ${url} | ${r.slowRisk} | ${r.firstClickRisk} | ${r.notes ?? ""} |`);
  }

  console.log("\nNegocios Locales lanes (from /negocios-locales):");
  console.log("  - Click each EXPLORE + ADVERTISE once; autos-dealer must land on resultados?seller=dealer");
  console.log("\nNetwork suspects:");
  console.log("  - rentas/results: listings query limit 5000");
  console.log("  - servicios/resultados: listServiciosPublicListingsRaw(500)");
  console.log("  - en-venta/results: client queryEnVentaBrowseListings (800 cap)");
  console.log("\nDone — no HTTP requests made by this script.\n");
}

printGuide();
