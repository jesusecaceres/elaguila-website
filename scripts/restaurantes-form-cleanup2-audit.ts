/**
 * Gate REST-FORM-CLEANUP2 — Languages, service modes, contact section static audit.
 * Run: npm run restaurantes:form-cleanup2-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PAGE = "app/(site)/publicar/restaurantes/page.tsx";
const CLIENT = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const CONFIG = "app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts";
const MODEL = "app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts";
const CONTACT_HUB = "app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts";
const AUDIT = "app/lib/clasificados/restaurantes/RESTAURANTES_FORM_CLEANUP2_AUDIT.md";

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/comida-local/",
  "app/(site)/clasificados/comida-local/",
  "app/lib/clasificados/comida-local/",
  "app/api/",
  "supabase/migrations/",
  "database/migrations/",
  "app/(site)/dashboard/",
  "app/admin/",
];

const ALLOWED_PREFIXES = [
  "app/(site)/publicar/restaurantes/",
  "app/(site)/clasificados/restaurantes/",
  "app/lib/clasificados/restaurantes/",
  "scripts/restaurantes-form-cleanup2-audit.ts",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
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

function isGateScopedChange(p: string): boolean {
  return ALLOWED_PREFIXES.some((a) => p === a || p.startsWith(a));
}

function run() {
  assert.ok(exists(AUDIT), `${AUDIT} must exist`);
  assert.ok(exists(PAGE), `${PAGE} must exist`);
  assert.ok(exists(CLIENT), `${CLIENT} must exist`);
  assert.ok(exists(CONFIG), `${CONFIG} must exist`);

  const client = read(CLIENT);
  const config = read(CONFIG);
  const model = read(MODEL);
  const hub = read(CONTACT_HUB);
  const pkg = read("package.json");

  assert.match(client, /customLanguages/, "client must support customLanguages");
  assert.match(client, /Añadir/, "Añadir language button must remain");
  assert.match(client, /RESTAURANTE_MAX_CUSTOM_LANGUAGES/, "max custom language limit must exist");
  assert.match(client, /Modos y servicios disponibles/, "consolidated service section heading must exist");
  assert.match(client, /RESTAURANTE_FORM_SERVICE_OPTIONS/, "client must use consolidated service options");
  assert.doesNotMatch(client, /Opciones de servicio \(detalles complementarios\)/, "duplicate complementarios block must be removed");
  assert.doesNotMatch(client, /\["popUp", "Pop-up"/, "Pop-up service checkbox must be removed");
  assert.match(config, /RESTAURANTE_FORM_SERVICE_OPTIONS/, "config must define consolidated service options");
  assert.match(config, /catering/, "Catering must remain in service options");
  assert.match(config, /Eventos/, "Eventos must remain in service options");
  assert.match(config, /Food truck/, "Food truck must remain");
  assert.match(config, /Chef personal/, "Chef personal must remain");
  assert.match(config, /Meal prep/, "Meal prep must remain");
  assert.match(config, /reservationsAvailable/, "Reservas flag must remain");
  assert.doesNotMatch(config, /pop_up.*RESTAURANTE_FORM_SERVICE/, "pop_up must be excluded from form service modes");

  assert.match(client, /Contacto principal/, "Contacto principal group must exist");
  assert.match(client, /Redes sociales/, "Redes sociales group must exist");
  assert.match(client, /instagramUrl/, "Instagram field must remain");
  assert.match(client, /facebookUrl/, "Facebook field must remain");
  assert.match(client, /tiktokUrl/, "TikTok field must remain");
  assert.match(client, /youtubeUrl/, "YouTube field must remain");
  assert.match(client, /snapchatUrl/, "Snapchat field must exist");
  assert.match(client, /xTwitterUrl/, "X/Twitter field must exist");
  assert.doesNotMatch(client, /linkedinUrl/, "LinkedIn must not be added");
  assert.doesNotMatch(client, /pinterestUrl/, "Pinterest must not be added");

  assert.match(client, /Opiniones \/ reputación/, "Opiniones group must exist");
  assert.match(client, /googleReviewUrl/, "Google review field must remain");
  assert.match(client, /yelpReviewUrl/, "Yelp field must remain");
  assert.match(client, /Acciones de restaurante/, "Acciones de restaurante group must exist");
  assert.match(client, /menuUrl/, "Menu URL field must remain");
  assert.match(client, /menuFile/, "Menu file field must remain");

  assert.match(model, /snapchatUrl/, "model must include snapchatUrl");
  assert.match(model, /xTwitterUrl/, "model must include xTwitterUrl");
  assert.match(model, /customLanguages/, "model must include customLanguages");
  assert.match(hub, /addSocial\("snapchat"/, "contact hub must output Snapchat");
  assert.match(hub, /addSocial\("x"/, "contact hub must output X/Twitter");

  assert.match(pkg, /restaurantes:form-cleanup2-audit/, "package script must exist");

  for (const file of changedFiles()) {
    if (!isGateScopedChange(file)) {
      const forbidden = FORBIDDEN_PREFIXES.some((p) => file.startsWith(p));
      if (forbidden) {
        assert.fail(`Forbidden path changed: ${file}`);
      }
    }
  }

  console.log("restaurantes-form-cleanup2-audit: PASS");
}

run();
