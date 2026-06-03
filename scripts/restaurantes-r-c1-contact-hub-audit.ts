/**
 * Gate R-C1 — Restaurante Contact Hub Standardization static audit.
 * Run: npm run restaurantes:r-c1-contact-hub-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = "app/lib/clasificados/restaurantes/RESTAURANTES_R_C1_CONTACT_HUB_AUDIT.md";

const REQUIRED_LABELS = [
  "Contáctanos",
  "Ordena o reserva",
  "Opiniones",
  "Síguenos",
  "Búscanos aquí",
  "Nuestra ubicación",
  "Horarios",
  "Llamar",
  "WhatsApp",
  "Mensaje",
  "Correo",
  "Menú",
  "Reservar",
  "Pedir ahora",
  "Sitio web",
  "Opiniones en Google",
  "Opiniones en Yelp",
  "Cómo llegar",
] as const;

const FAKE_PATTERNS = [
  /fakeRating/i,
  /fakeReviewCount/i,
  /fakeFollowers/i,
  /fakeAnalytics/i,
  /placeholderRating/i,
  /inventedStars/i,
];

const ALLOWED_PREFIXES = [
  "app/(site)/clasificados/restaurantes/",
  "app/(site)/publicar/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-r-c1-contact-hub-audit.ts",
  "scripts/restaurant-contact-hub-qa.ts",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowedPath(p: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

function restaurantSourceFiles(): string[] {
  const dirs = [
    "app/(site)/clasificados/restaurantes",
    "app/(site)/publicar/restaurantes",
    "app/lib/clasificados/restaurantes",
  ];
  const out: string[] = [];
  for (const dir of dirs) {
    const abs = path.join(ROOT, dir.replace(/\//g, path.sep));
    if (!fs.existsSync(abs)) continue;
    const walk = (d: string, base: string) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const rel = `${base}/${ent.name}`;
        if (ent.isDirectory()) walk(path.join(d, ent.name), rel);
        else if (/\.(tsx?|md)$/.test(ent.name)) out.push(rel);
      }
    };
    walk(abs, dir);
  }
  return out;
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT_MD)), `${AUDIT_MD} must exist`);
  const md = read(AUDIT_MD);
  assert.ok(md.includes("Gate R-C1"), "Audit title");
  assert.ok(md.includes("## Servicios reference findings"), "Servicios reference section");
  assert.ok(/Application-to-output mapping/i.test(md), "Application-to-output mapping section");
  assert.ok(md.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table header");

  const hubUi = read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx");
  const hubBuild = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
  const combined = `${hubUi}\n${hubBuild}`;

  for (const label of REQUIRED_LABELS) {
    assert.ok(combined.includes(label), `Missing Spanish label: ${label}`);
  }

  for (const pat of FAKE_PATTERNS) {
    assert.ok(!hubUi.match(pat), `Suspicious fake-data pattern in hub UI: ${pat}`);
    assert.ok(!hubBuild.match(pat), `Suspicious fake-data pattern in hub builder: ${pat}`);
  }

  assert.ok(hubBuild.includes("orderReserve"), "orderReserve section in builder");
  assert.ok(hubUi.includes("restaurantHubSocialBrandStyle"), "Platform social brand styles");
  assert.ok(hubUi.includes("RestaurantHubReviewLinkButton"), "Branded review cards");
  assert.ok(read("app/(site)/clasificados/restaurantes/shell/RestaurantContactHubFauxMap.tsx").includes("max-h-[148px]"), "Compact map");

  const pkg = read("package.json");
  assert.ok(pkg.includes('"restaurantes:r-c1-contact-hub-audit"'), "package.json audit script");

  const changed = changedFiles();
  const blocked = changed.filter(
    (p) =>
      p.includes("stripe") ||
      p.includes("Stripe") ||
      p.startsWith("app/admin/") ||
      (p.includes("dashboard") && p.startsWith("app/")),
  );
  assert.equal(blocked.length, 0, `Blocked paths touched: ${blocked.join(", ")}`);

  const unrelated = changed.filter((p) => !isAllowedPath(p));
  assert.equal(unrelated.length, 0, `Unrelated changed files: ${unrelated.join(", ")}`);

  const restaurantFiles = restaurantSourceFiles();
  const touchedRestaurant = changed.filter((p) => p.startsWith("app/(site)/clasificados/restaurantes/"));
  for (const f of touchedRestaurant) {
    for (const pat of FAKE_PATTERNS) {
      if (fs.existsSync(path.join(ROOT, f.replace(/\//g, path.sep)))) {
        const body = read(f);
        assert.ok(!body.match(pat), `Fake pattern in ${f}`);
      }
    }
  }

  console.log("OK: restaurantes:r-c1-contact-hub-audit passed");
  console.log(`Changed files (${changed.length}):`, changed.length ? changed.join(", ") : "(none tracked yet)");
}

run();
