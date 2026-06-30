/**
 * scripts/comunidad-com2-completion-audit.ts
 *
 * COM-2 completion audit for Comunidad y Eventos.
 * Run with: npx tsx scripts/comunidad-com2-completion-audit.ts
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

// ── 1. COM-2 audit file exists ────────────────────────────────────────────────
{
  const exists = fileExists("app/lib/clasificados/comunidad/COMUNIDAD_EVENTOS_COM2_COMPLETION_AUDIT.md");
  check("COM-2 audit file exists", exists);
  if (exists) {
    const src = readSrc("app/lib/clasificados/comunidad/COMUNIDAD_EVENTOS_COM2_COMPLETION_AUDIT.md");
    check("Audit: TRUE/FALSE table exists", src.includes("TRUE/FALSE"));
    check("Audit: date/time automation documented", src.includes("dayKeysBetween") || src.includes("dateChanged"));
    check("Audit: social persistence documented", src.includes("socialFacebook") || src.includes("Social Link Persistence"));
  }
}

// ── 2. Key Spanish labels in CommunityContactCanvas ──────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  check("Label: Contacto del organizador", src.includes("Contacto del organizador"));
  check("Label: Síguenos", src.includes("Síguenos"));
  check("Label: Lugar del evento", src.includes("Lugar del evento"));
  check("Label: Más información", src.includes("Más información"));
  check("Label: Publicado en Leonix", src.includes("Publicado en Leonix"));
  check("Label: Ver en el mapa", src.includes("Ver en el mapa"));
  check("Label: No raw GH.orange usage", !src.includes("GH.orange"));
  check("Brand: burgundy color used", src.includes("#7B2D42") || src.includes("GH.burgundy"));
  check("Social section guard (socialItems.length)", src.includes("socialItems.length"));
  check("Location section guard (hasLocation)", src.includes("hasLocation"));
  check("Trust cue present", src.includes("trustLabel") || src.includes("Published on Leonix"));
}

// ── 3. WeeklyScheduleEditor has No aplica label support ──────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/components/WeeklyScheduleEditor.tsx");
  check("WeeklyScheduleEditor: closedLabel prop", src.includes("closedLabel"));
  check("WeeklyScheduleEditor: checkbox toggle", src.includes("closed"));
}

// ── 4. SmartSchedule uses ref pattern (no stale-closure bug) ─────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx");
  check("SmartSchedule: scheduleRef used", src.includes("scheduleRef"));
  check("SmartSchedule: onChangeRef used", src.includes("onChangeRef"));
  check("SmartSchedule: simplified activation (row.closed)", src.includes("row.closed"));
  check("SmartSchedule: weeklySchedule NOT in dep array", !src.includes(", weeklySchedule,"));
  check("SmartSchedule: onChange NOT in dep array", !src.includes(", onChange]"));
  check("SmartSchedule: manual override removes from autoFilledRef", src.includes("autoFilledRef.current.delete(day)"));
  check("SmartSchedule: dateToDayKey function", src.includes("dateToDayKey"));
  check("SmartSchedule: dayKeysBetween function", src.includes("dayKeysBetween"));
  check("SmartSchedule: helper copy ES present", src.includes("Activamos los días"));
  check("SmartSchedule: helper copy EN present", src.includes("We activate the days"));
}

// ── 5. Publish pipeline includes social links ─────────────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  check("Publish: Leonix:socialFacebook", src.includes("Leonix:socialFacebook"));
  check("Publish: Leonix:socialInstagram", src.includes("Leonix:socialInstagram"));
  check("Publish: Leonix:socialTiktok", src.includes("Leonix:socialTiktok"));
  check("Publish: Leonix:socialYoutube", src.includes("Leonix:socialYoutube"));
  check("Publish: Leonix:socialXTwitter", src.includes("Leonix:socialXTwitter"));
  check("Publish: Leonix:socialLinkedin", src.includes("Leonix:socialLinkedin"));
  check("Publish: Leonix:website", src.includes("Leonix:website"));
}

// ── 6. Hydration includes social links ────────────────────────────────────────
{
  const src = readSrc("app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts");
  check("Hydration: socialFacebook", src.includes("socialFacebook"));
  check("Hydration: socialInstagram", src.includes("socialInstagram"));
}

// ── 7. No Stripe files modified ───────────────────────────────────────────────
{
  let diffOutput = "";
  try {
    diffOutput = execSync("git diff --name-only HEAD~1 HEAD", { cwd: ROOT }).toString();
  } catch {
    diffOutput = "";
  }
  const stripeModified = diffOutput.split("\n").some((f) => f.toLowerCase().includes("stripe"));
  check("No Stripe files modified", !stripeModified);
}

// ── 8. No Supabase migration/schema files modified ────────────────────────────
{
  let diffOutput = "";
  try {
    diffOutput = execSync("git diff --name-only HEAD~1 HEAD", { cwd: ROOT }).toString();
  } catch {
    diffOutput = "";
  }
  const supabaseModified = diffOutput.split("\n").some((f) =>
    f.includes("supabase/migrations") || f.includes("supabase/schema"),
  );
  check("No Supabase migration/schema files modified", !supabaseModified);
}

// ── 9. No unrelated category directories modified ─────────────────────────────
{
  let diffOutput = "";
  try {
    diffOutput = execSync("git status --short", { cwd: ROOT }).toString();
  } catch {
    diffOutput = "";
  }
  const dirtyFiles = diffOutput
    .split("\n")
    .map((l) => l.trim().replace(/^[A-Z?!]\s+/, ""))
    .filter(Boolean);

  const unrelated = dirtyFiles.filter((f) => {
    const lower = f.toLowerCase();
    return (
      (lower.includes("/autos/") ||
        lower.includes("/bienes-raices/") ||
        lower.includes("/empleos/") ||
        lower.includes("/en-venta/") ||
        lower.includes("/rentas/") ||
        lower.includes("/restaurantes/") ||
        lower.includes("/tienda/") ||
        lower.includes("stripe") ||
        lower.includes("supabase/migration")) &&
      !lower.includes("community") &&
      !lower.includes("comunidad") &&
      !lower.includes("clases")
    );
  });
  check("No unrelated category directories modified", unrelated.length === 0, unrelated.join(", ") || "none");
}

// ── 10. .env.local not staged ─────────────────────────────────────────────────
{
  let staged = "";
  try {
    staged = execSync("git diff --name-only --cached", { cwd: ROOT }).toString();
  } catch {
    staged = "";
  }
  check(".env.local not staged", !staged.includes(".env.local"));
  check("package-lock.json not staged", !staged.includes("package-lock.json"));
  check("node_modules not staged", !staged.includes("node_modules"));
}

// ── 11. No fake review/rating strings ────────────────────────────────────────
{
  const contactSrc = readSrc("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  const noFake =
    !contactSrc.includes("★") &&
    !contactSrc.includes("4.8") &&
    !contactSrc.includes("rating") &&
    !contactSrc.includes("reviews");
  check("No fake ratings/reviews in ContactCanvas", noFake);
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────────────────────");
console.log(" COM-2 Comunidad y Eventos Completion Audit");
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
