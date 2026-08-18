import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exists = (p) => {
  if (!existsSync(path.join(repoRoot, p))) throw new Error(`Route artifact missing ${p}`);
};

for (const route of [
  "app/(site)/publicar/ofertas-locales/page.tsx",
  "app/(site)/publicar/ofertas-locales/preview/page.tsx",
  "app/(site)/dashboard/ofertas-locales/page.tsx",
  "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
  "app/(site)/clasificados/ofertas-locales/page.tsx",
  "app/(site)/clasificados/ofertas-locales/results/page.tsx",
  "app/(site)/cupones/page.tsx",
  "app/(site)/cupones/resultados/page.tsx",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx",
  "app/api/ofertas-locales/public-offers/route.ts",
  "app/api/ofertas-locales/publish/route.ts",
]) exists(route);

const ownerList = readFileSync(path.join(repoRoot, "app/(site)/dashboard/ofertas-locales/page.tsx"), "utf8");
const ownerDetail = readFileSync(path.join(repoRoot, "app/(site)/dashboard/ofertas-locales/[id]/page.tsx"), "utf8");
const publicHelpers = readFileSync(path.join(repoRoot, "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts"), "utf8");

for (const marker of ["/publicar/ofertas-locales", "/dashboard/ofertas-locales/", "publicResultsHref", "operationalStatus.publicLinkAllowed"]) {
  if (!ownerList.includes(marker) && !ownerDetail.includes(marker)) throw new Error(`Owner link guard missing ${marker}`);
}

for (const marker of ["expires_at", "published_at", "isOfertaLocalPublicTermActive", "id: row.id"]) {
  if (!publicHelpers.includes(marker)) throw new Error(`Public route eligibility missing ${marker}`);
}

if (ownerList.includes("leonixmedia.com") || ownerDetail.includes("leonixmedia.com")) {
  throw new Error("Production URL hardcoded in Ofertas owner routes.");
}

console.log("PASS: Package 13 Ofertas route and link certification passed.");
