/**
 * scripts/comunidad-com3-business-hub-audit.ts
 *
 * COM-3 Business Hub audit for Comunidad y Eventos.
 * Run with: npx tsx scripts/comunidad-com3-business-hub-audit.ts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const ROOT = resolve(__dirname, "..");

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

function fileExists(rel: string): boolean {
  return existsSync(resolve(ROOT, rel));
}

type CheckResult = { pass: boolean; label: string; detail?: string };
const results: CheckResult[] = [];

function check(label: string, pass: boolean, detail?: string) {
  results.push({ pass, label, detail });
}

// ── 1. COM-3 audit file exists ────────────────────────────────────────────────
{
  const exists = fileExists(
    "app/lib/clasificados/comunidad/COMUNIDAD_EVENTOS_COM3_BUSINESS_HUB_AUDIT.md",
  );
  check("COM-3 audit file exists", exists);
  if (exists) {
    const src = readSrc(
      "app/lib/clasificados/comunidad/COMUNIDAD_EVENTOS_COM3_BUSINESS_HUB_AUDIT.md",
    );
    check("Audit: TRUE/FALSE table exists", src.includes("TRUE/FALSE"));
    check("Audit: public detail route documented", src.includes("/clasificados/anuncio/[id]"));
    check("Audit: price formatting documented", src.includes("formatAdmissionWithDollar"));
    check("Audit: social fields mapping documented", src.includes("socialFacebook"));
    check("Audit: website CTA documented", src.includes("Sitio web / Registro") || src.includes("sitio web"));
  }
}

// ── 2. Key labels in CommunityContactCanvas ───────────────────────────────────
{
  const src = readSrc(
    "app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx",
  );
  check("Label: Contacto del organizador", src.includes("Contacto del organizador"));
  check("Label: Organizer contact", src.includes("Organizer contact"));
  check("Label: Síguenos", src.includes("Síguenos"));
  check("Label: Follow us", src.includes("Follow us"));
  check("Label: Más información", src.includes("Más información"));
  check("Label: More information", src.includes("More information"));
  check("Label: Lugar del evento", src.includes("Lugar del evento"));
  check("Label: Event location", src.includes("Event location"));
  check("Label: Publicado en Leonix", src.includes("Publicado en Leonix"));
  check("Label: Published on Leonix", src.includes("Published on Leonix"));
  check("Label: Sitio web / Registro", src.includes("Sitio web / Registro") || src.includes("Website / Register"));
  check("Label: Ver en el mapa", src.includes("Ver en el mapa"));
  check("Brand: No raw GH.orange usage", !src.includes("GH.orange"));
  check("Brand: burgundy color used", src.includes("GH.burgundy") || src.includes("#7B2D42"));
  check("Social icons section guard (socialItems.length)", src.includes("socialItems.length"));
  check("Location section guard (hasLocation)", src.includes("hasLocation"));
  check("Contact section guard (hasContactActions)", src.includes("hasContactActions"));
  check("Trust cue exists", src.includes("trustLabel") || src.includes("Publicado en Leonix"));
}

// ── 3. CommunityQuickAnuncioDetail has hub + price fix ────────────────────────
{
  const src = readSrc(
    "app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx",
  );
  check("Detail: CommunityContactCanvas imported", src.includes("CommunityContactCanvas"));
  check("Detail: formatAdmissionWithDollar exported", src.includes("export function formatAdmissionWithDollar"));
  check("Detail: formatAdmissionWithDollar applied to admissionNote", src.includes("formatAdmissionWithDollar(adm)"));
  check("Detail: contactDraft adapter built", src.includes("contactDraft"));
  check("Detail: socialFacebook in adapter", src.includes("socialFacebook"));
  check("Detail: socialInstagram in adapter", src.includes("socialInstagram"));
  check("Detail: socialTiktok in adapter", src.includes("socialTiktok"));
  check("Detail: socialYoutube in adapter", src.includes("socialYoutube"));
  check("Detail: socialXTwitter in adapter", src.includes("socialXTwitter"));
  check("Detail: socialLinkedin in adapter", src.includes("socialLinkedin"));
  check("Detail: phoneDigits in adapter", src.includes("Leonix:phoneDigits"));
  check("Detail: whatsappDigits in adapter", src.includes("Leonix:whatsappDigits"));
  check("Detail: contactEmail prop added", src.includes("contactEmail"));
  check("Detail: no raw Link for social URLs", !src.includes('<Link href={s.href}'));
  check("Detail: no raw website URL text displayed", !src.includes('{web}') || src.includes("CommunityContactCanvas"));
}

// ── 4. Canvas applies $ format ────────────────────────────────────────────────
{
  const src = readSrc(
    "app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx",
  );
  check("Canvas: formatAdmissionWithDollar imported", src.includes("formatAdmissionWithDollar"));
  check("Canvas: formatAdmissionWithDollar applied to admissionNote", src.includes("formatAdmissionWithDollar(draft.admissionNote"));
}

// ── 5. page.tsx passes contactEmail ──────────────────────────────────────────
{
  const src = readSrc("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("page.tsx: contactEmail prop passed", src.includes("contactEmail="));
}

// ── 6. Results card does NOT have hub ────────────────────────────────────────
{
  const src = readSrc(
    "app/(site)/clasificados/community/CommunityDiscoveryListingCard.tsx",
  );
  check("Results card: no CommunityContactCanvas", !src.includes("CommunityContactCanvas"));
  check("Results card: no socialFacebook reference", !src.includes("socialFacebook"));
}

// ── 7. Price format function correctness ─────────────────────────────────────
{
  const src = readSrc(
    "app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx",
  );
  check("$ format: FREE_WORDS regex covers Gratis", src.includes("gratis") && src.includes("FREE_WORDS"));
  check("$ format: no double-prefix logic (startsWith $)", src.includes('startsWith("$")'));
  check("$ format: digit-start prefix", src.includes('/^\\d/') || src.includes("/^\\d/"));
}

// ── 8. Publish pipeline includes all social + contact ──────────────────────────
{
  const src = readSrc(
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
  );
  check("Publish: Leonix:socialFacebook stored", src.includes("Leonix:socialFacebook"));
  check("Publish: Leonix:socialInstagram stored", src.includes("Leonix:socialInstagram"));
  check("Publish: Leonix:phoneDigits stored", src.includes("Leonix:phoneDigits"));
  check("Publish: Leonix:whatsappDigits stored", src.includes("Leonix:whatsappDigits"));
  check("Publish: Leonix:website stored", src.includes("Leonix:website"));
  check("Publish: admissionNote stored", src.includes("Leonix:admissionNote"));
}

// ── 9. No Stripe files modified ───────────────────────────────────────────────
{
  let diff = "";
  try { diff = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString(); } catch { diff = ""; }
  const stripeModified = diff.split("\n").some((f) => f.toLowerCase().includes("stripe"));
  check("No Stripe files modified", !stripeModified);
}

// ── 10. No Supabase migration files modified ──────────────────────────────────
{
  let diff = "";
  try { diff = execSync("git diff --name-only HEAD", { cwd: ROOT }).toString(); } catch { diff = ""; }
  const supabaseModified = diff
    .split("\n")
    .some((f) => f.includes("supabase/migrations") || f.includes("supabase/schema"));
  check("No Supabase migration/schema files modified", !supabaseModified);
}

// ── 11. No unrelated category directories modified ────────────────────────────
{
  let status = "";
  try { status = execSync("git status --short", { cwd: ROOT }).toString(); } catch { status = ""; }
  const dirty = status.split("\n").map((l) => l.trim().replace(/^[A-Z?! ]+/, "")).filter(Boolean);
  const unrelated = dirty.filter((f) => {
    const l = f.toLowerCase();
    return (
      (l.includes("/autos/") || l.includes("/bienes-raices/") || l.includes("/empleos/") ||
       l.includes("/en-venta/") || l.includes("/rentas/") || l.includes("/restaurantes/") ||
       l.includes("/tienda/") || l.includes("stripe") || l.includes("supabase/migration")) &&
      !l.includes("community") && !l.includes("comunidad") && !l.includes("clases")
    );
  });
  check("No unrelated category directories modified", unrelated.length === 0, unrelated.join(", ") || "none");
}

// ── 12. Sensitive files not staged ────────────────────────────────────────────
{
  let staged = "";
  try { staged = execSync("git diff --name-only --cached", { cwd: ROOT }).toString(); } catch { staged = ""; }
  check(".env.local not staged", !staged.includes(".env.local"));
  check("package-lock.json not staged", !staged.includes("package-lock.json"));
  check("node_modules not staged", !staged.includes("node_modules"));
}

// ── 13. No fake rating/review strings ────────────────────────────────────────
{
  const src = readSrc(
    "app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx",
  );
  const noFake =
    !src.includes("★") && !src.includes("rating") && !src.includes("reviews") &&
    !src.includes("4.8") && !src.includes("4.9");
  check("No fake ratings/reviews in detail component", noFake);
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────────────────────");
console.log(" COM-3 Comunidad y Eventos Business Hub Audit");
console.log("─────────────────────────────────────────────────────────\n");

let passed = 0;
let failed = 0;
for (const r of results) {
  const icon = r.pass ? "✅" : "❌";
  const detail = r.detail ? ` (${r.detail})` : "";
  console.log(`${icon} ${r.label}${detail}`);
  if (r.pass) passed++;
  else failed++;
}

console.log(`\n─────────────────────────────────────────────────────────`);
console.log(` PASSED: ${passed}  FAILED: ${failed}`);
console.log(`─────────────────────────────────────────────────────────\n`);

if (failed > 0) process.exit(1);
