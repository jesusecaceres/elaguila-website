/**
 * Gate HOME-LAUNCH — public Home launch-structure audit (source-derived, no build/server).
 * Run: npm run website:home-launch-audit
 *
 * Asserts the approved launch Home: modern hero, ONE canonical current edition shared with the
 * Revista hub, discovery section on real routes, teaser-only learning block, truthful
 * advertising split, simplified newsletter close, language preservation, and NO legacy
 * `/publicar` routing from any Home / global advertise CTA.
 */
import fs from "fs";
import path from "path";
import { HOME_ANCHORS, HOME_DISCOVER_ROUTES, HOME_PAGE_COPY, HOME_ROUTES } from "../app/(site)/home/homePageCopy";
import { ADVERTISE_INTENT_PATHS, getAdvertiseDropdownOptions } from "../app/lib/advertiseDropdownConfig";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(root, rel));

type Row = { requirement: string; status: "PASS" | "FAIL" | "NOTE"; evidence: string };
const rows: Row[] = [];
const add = (requirement: string, pass: boolean, evidence: string) =>
  rows.push({ requirement, status: pass ? "PASS" : "FAIL", evidence });
const note = (requirement: string, evidence: string) => rows.push({ requirement, status: "NOTE", evidence });

const homeClient = read("app/(site)/home/HomeMarketingClient.tsx");
const homePage = read("app/(site)/home/page.tsx");
const destacados = read("app/(site)/home/HomeDestacadosSection.tsx");
const homeCopy = read("app/(site)/home/homePageCopy.ts");
const merge = read("app/lib/siteSectionContent/homeMarketingMerge.ts");
const navbar = read("app/components/Navbar.tsx");
const dropdown = read("app/components/AdvertiseDropdown.tsx");
const advertiseConfig = read("app/lib/advertiseDropdownConfig.ts");
const currentEdition = read("app/lib/magazine/currentEdition.ts");
const hub = read("app/(site)/magazine/MagazineHubClient.tsx");

// --- Hero (Gate 2)
const es = HOME_PAGE_COPY.es;
const en = HOME_PAGE_COPY.en;
add("ES hero headline", es.hero.title === "Tu comunidad. Todo en un solo lugar.", es.hero.title);
add("EN hero headline", en.hero.title === "Your community. All in one place.", en.hero.title);
add("ES hero CTAs", es.hero.ctaPrimary === "Explorar Leonix" && es.hero.ctaSecondary === "Haz crecer tu negocio", "homePageCopy.ts");
add("EN hero CTAs", en.hero.ctaPrimary === "Explore Leonix" && en.hero.ctaSecondary === "Grow your business", "homePageCopy.ts");
add("Old identity line not rendered by Home", ![homeClient, homeCopy].some((s) => s.includes("Comunidad, Cultura y Fe")) && !homeClient.includes("L.identity"), "homePageCopy.ts + HomeMarketingClient.tsx (merge BASE retained for CMS back-compat)");
add("Home reads only announcement + modules from the CMS merge", homeClient.includes("L.announcement") && homeClient.includes("content.modules.showAnnouncement") && homeClient.includes("content.modules.showHeroImage") && !/content\.(coverImageSrc|ctaPrimaryHref|ctaSecondaryHref|callouts)|L\.(title|identity|precedent|valuePrimary|valueSecondary|ctaPrimary|ctaSecondary|microcopy|coverAlt|promoStrip)/.test(homeClient), "HomeMarketingClient.tsx");
add("CMS merge file untouched by Home launch (BASE retained)", merge.includes("Comunidad, Cultura y Fe") && merge.includes("export function mergeHomeMarketing"), "homeMarketingMerge.ts");
// --- Admin truth (Gate H4)
const adminContent = read("app/admin/(dashboard)/workspace/home/content/page.tsx");
const adminHome = read("app/admin/(dashboard)/workspace/home/page.tsx");
add("Admin: live controls still editable", /name="announce_es"(?![^>]*readOnly)/.test(adminContent) && /name="mod_ann"/.test(adminContent) && /name="mod_hero_img"/.test(adminContent), "admin/workspace/home/content/page.tsx");
add("Admin: dead hero/CTA/cover controls read-only in a legacy area", adminContent.includes("Legacy fields (read-only)") && adminContent.includes("function LegacyField") && ["title_es", "identity_es", "precedent_es", "cta_primary_es", "cta_primary_href", "cover_image_src", "cover_alt_es"].every((n) => adminContent.includes(`<LegacyField label="${n === "title_es" ? "Title ES" : n === "identity_es" ? "Identity ES" : n === "precedent_es" ? "Subtitle ES" : n === "cta_primary_es" ? "Primary CTA ES" : n === "cta_primary_href" ? "Primary CTA URL" : n === "cover_image_src" ? "URL or path" : "Image alt ES"}" name="${n}"`)) && adminContent.includes("name={`callout_${idx + 1}_href`}") && /name={name} readOnly/.test(adminContent), "admin/workspace/home/content/page.tsx");
add("Admin: legacy toggles preserved via hidden inputs (no blanking on save)", adminContent.includes('name="mod_secondary" value="on"') && adminContent.includes('name="mod_callouts" value="on"') && adminContent.includes('name="callouts_placement" value={m.calloutsPlacement}'), "admin/workspace/home/content/page.tsx");
add("Admin: code-owned architecture comment present", adminContent.includes("Home launch architecture is code-owned") && adminHome.includes("Home launch architecture is code-owned"), "admin home pages");
add("Admin: save action unchanged (backward compatible)", !exists("app/admin/homeMarketingActions.ts") || read("app/admin/homeMarketingActions.ts").includes('str(formData, "title_es")'), "homeMarketingActions.ts");
// --- BR/Rentas evidence untouched
add("BR/Rentas evidence files present (untracked, preserved)", ["BR_RENTAS_OWNER_CHANGE_LEDGER_AUDITED", "BR_RENTAS_OWNER_LIVE_QA_RUNBOOK", "BR_RENTAS_OWNER_RUNTIME_QA", "BR_RENTAS_OWNER_VISUAL_QA_CHECKLIST", "BR_RENTAS_REQUIREMENTS_RECONCILIATION"].every((n) => exists(`.claude/${n}.md`)), ".claude/BR_RENTAS_*.md");
add("Hero CTAs are in-page anchors", homeClient.includes("href={exploreAnchor}") && homeClient.includes("href={advertiseAnchor}"), "HomeMarketingClient.tsx");
add("Hero no AdvertiseDropdown", !homeClient.includes("AdvertiseDropdown"), "HomeMarketingClient.tsx");

// --- Current edition (Gate 3)
add("Home consumes shared current edition", homeClient.includes('from "@/app/lib/magazine/currentEdition"'), "HomeMarketingClient.tsx");
add("page.tsx resolves manifest → edition", homePage.includes("resolvePublicMagazineManifest") && homePage.includes("resolveCurrentMagazineEdition"), "home/page.tsx");
add("Hub consumes shared current edition", hub.includes('from "@/app/lib/magazine/currentEdition"') && !hub.includes("titleEs: \""), "MagazineHubClient.tsx");
add("Home does not hardcode a month/cover", !homeClient.includes("content.coverImageSrc") && !/\/magazine\/2026\//.test(homeClient) && !/junio|june/i.test(homeClient.replace(/\/\*[\s\S]*?\*\//g, "")), "HomeMarketingClient.tsx");
add("Shared edition helper defines ONE base record", (currentEdition.match(/CURRENT_MAGAZINE_EDITION: MagazineEdition = \{/g) ?? []).length === 1, "currentEdition.ts");
add("Cover object-contain + aspect ratio", homeClient.includes("object-contain") && homeClient.includes("aspect-[550/713]"), "HomeMarketingClient.tsx");

// --- Ecosystem removed (Gate 4) + discovery (Gate 5)
add("Ecosystem/pillars sections removed", !homeClient.includes("home-ecosystem-title") && !homeClient.includes("home-pillars-title"), "HomeMarketingClient.tsx");
add("Discovery anchor #explorar", HOME_ANCHORS.explore === "explorar" && homeClient.includes("id={HOME_ANCHORS.explore}"), "HomeMarketingClient.tsx");
add("Discovery ES title", es.discover.title === "¿Qué buscas hoy?", es.discover.title);
add("Discovery EN title", en.discover.title === "What are you looking for today?", en.discover.title);
for (const [id, route] of Object.entries(HOME_DISCOVER_ROUTES)) {
  const pageRel = `app/(site)${route}/page.tsx`;
  add(`Discovery route exists: ${id} → ${route}`, exists(pageRel), pageRel);
}
add("Ofertas Locales is the featured doorway", es.discover.items[0]?.id === "ofertas-locales" && es.discover.items[0]?.featured === true, "homePageCopy.ts");
add("No advertising inside discovery cards", !es.discover.items.some((i) => /anúnciate|anuncia/i.test(`${i.title} ${i.description}`)), "homePageCopy.ts");

// --- Featured (Gate 6)
add("Featured empty state has no AdvertiseDropdown", !destacados.includes("AdvertiseDropdown"), "HomeDestacadosSection.tsx");
add("Featured empty state single CTA → Negocios Locales", destacados.includes("HOME_ROUTES.featuredBusinesses") && HOME_ROUTES.featuredBusinesses === "/negocios-locales", "HomeDestacadosSection.tsx");

// --- Learn teaser (Gate 7)
add("Learn anchor #aprende", HOME_ANCHORS.learn === "aprende" && homeClient.includes("id={HOME_ANCHORS.learn}"), "HomeMarketingClient.tsx");
add("No internal business tools exposed on Home", !/Identidad de negocio|Mapa de salud|Concierge DIY|Configurar tu negocio|Health Map|dashboard\/business-tools/i.test(homeClient + homeCopy), "HomeMarketingClient.tsx + homePageCopy.ts");
if (exists(`app/(site)${HOME_ROUTES.learningCenter}/page.tsx`)) {
  add(`Learning Center route exists: ${HOME_ROUTES.learningCenter}`, true, `app/(site)${HOME_ROUTES.learningCenter}/page.tsx`);
} else {
  note(`Learning Center route ${HOME_ROUTES.learningCenter} not on this branch`, "exists on main (app/(site)/aprender) — integration gate must merge main before Home ships");
}

// --- Business section (Gate 8) + advertise menu (Gate 9)
add("Advertise anchor #anunciate", HOME_ANCHORS.advertise === "anunciate" && homeClient.includes("id={HOME_ANCHORS.advertise}"), "HomeMarketingClient.tsx");
add("Digital presence → existing route", HOME_ROUTES.digitalPresence === "/negocios-locales" && exists("app/(site)/negocios-locales/page.tsx"), HOME_ROUTES.digitalPresence);
add("Magazine + digital → Media Kit", HOME_ROUTES.magazineDigital === "/media-kit" && exists("app/(site)/media-kit/page.tsx"), HOME_ROUTES.magazineDigital);
add("No /publicar in advertise config", !/redirect=|\/publicar\?/.test(advertiseConfig) && !advertiseConfig.includes("buildClasificadosAdvertiseHref"), "advertiseDropdownConfig.ts");
add("No /publicar in Home files", ![homeClient, homePage, destacados, homeCopy].some((s) => s.includes("/publicar")), "app/(site)/home/*");
const options = getAdvertiseDropdownOptions("es");
add("Advertise menu has 5 intents", options.length === 5, options.map((o) => o.id).join(", "));
add("Post in Classifieds → /clasificados", ADVERTISE_INTENT_PATHS["post-classified"] === "/clasificados" && options.some((o) => o.id === "post-classified" && o.href.startsWith("/clasificados?")), options.find((o) => o.id === "post-classified")?.href ?? "");
add("Talk to Leonix → /contacto", options.some((o) => o.id === "contact" && o.href.startsWith("/contacto?")), options.find((o) => o.id === "contact")?.href ?? "");
add("Every advertise option preserves lang", (["es", "en", "pt", "tl"] as const).every((l) => getAdvertiseDropdownOptions(l).every((o) => o.href.includes(`lang=${l}`))), "getAdvertiseDropdownOptions");

// --- Newsletter close (Gate 10)
add("Newsletter form posts to /newsletter with lang", homeClient.includes('action={HOME_ROUTES.newsletter}') && homeClient.includes('name="lang" value={routeLang}'), "HomeMarketingClient.tsx");
add("Newsletter business CTA → #anunciate", homeClient.includes("href={advertiseAnchor}") && es.convert.businessCta === "Ver opciones para negocios", "HomeMarketingClient.tsx");
add("Newsletter block has no dropdown / contact CTA", !/AdvertiseDropdown|\/contacto/.test(homeClient), "HomeMarketingClient.tsx");

// --- Header / dropdown (Gate 1)
add("Desktop advertise menu viewport-safe", dropdown.includes("max-h-[min(70vh") && dropdown.includes("overflow-y-auto") && dropdown.includes("max-w-[calc(100vw"), "AdvertiseDropdown.tsx");
add("Desktop Más menu viewport-safe", navbar.includes("max-h-[min(70vh,24rem)]"), "Navbar.tsx");
add("Mobile drawer advertise rendered inline (no popover)", navbar.includes("advertiseOptions.map") && !navbar.includes("fullWidth"), "Navbar.tsx");
add("Dropdown keyboard support", dropdown.includes('"ArrowDown"') && dropdown.includes('"Escape"'), "AdvertiseDropdown.tsx");

// --- ES/EN parity (Gate 12)
function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof obj === "string") return { [prefix]: obj };
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => Object.assign(out, flatten(v, `${prefix}[${i}]`)));
    return out;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === "boolean") continue;
      Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}
const flatEs = flatten(es);
const flatEn = flatten(en);
const missingEn = Object.keys(flatEs).filter((k) => !(k in flatEn) || !flatEn[k].trim());
const missingEs = Object.keys(flatEn).filter((k) => !(k in flatEs) || !flatEs[k].trim());
add("EN has every ES key (non-empty)", missingEn.length === 0, missingEn.join(", ") || "complete");
add("ES has every EN key (non-empty)", missingEs.length === 0, missingEs.join(", ") || "complete");
const ALLOWED_SAME = new Set(["hero.eyebrow"]);
const identical = Object.keys(flatEs).filter(
  (k) => !ALLOWED_SAME.has(k) && !k.endsWith(".href") && !k.endsWith(".id") && flatEs[k] === flatEn[k],
);
add("No untranslated ES→EN strings", identical.length === 0, identical.join(", ") || "all translated");
const enSpanishLeak = Object.entries(flatEn).filter(([k, v]) => !k.endsWith(".href") && !k.endsWith(".id") && /[áéíóúñ¿¡]/i.test(v));
add("EN copy contains no Spanish characters", enSpanishLeak.length === 0, enSpanishLeak.map(([k]) => k).join(", ") || "clean");
add("PT/TL dictionaries preserved", Boolean(HOME_PAGE_COPY.pt?.hero?.title) && Boolean(HOME_PAGE_COPY.tl?.hero?.title), "homePageCopy.ts");

// --- Language preservation on Home links
add("Home wraps every route with lang", ["withLang(item.href)", "withLang(HOME_ROUTES.learningCenter)", "withLang(HOME_ROUTES.digitalPresence)", "withLang(HOME_ROUTES.magazineDigital)"].every((s) => homeClient.includes(s)) && homeClient.includes("magazineEditionReaderHref(edition, routeLang)") && homeClient.includes("magazineHubHref(routeLang)"), "HomeMarketingClient.tsx");
add("Nav links preserve lang", navbar.includes("const buildLink = (href: string) => `${href.split(\"?\")[0]}?lang=${navLang}`"), "Navbar.tsx");

// --- Responsive source QA (Gate 13)
add("Anchored sections offset fixed header", (homeClient.match(/scroll-mt-24/g) ?? []).length >= 3, "HomeMarketingClient.tsx");
add("No horizontal overflow on main", homeClient.includes("overflow-x-hidden"), "HomeMarketingClient.tsx");
add("Discovery grid stacks (sm:grid-cols-2 lg:grid-cols-3)", homeClient.includes("sm:grid-cols-2 lg:grid-cols-3"), "HomeMarketingClient.tsx");
add("Newsletter form stacks on mobile", homeClient.includes("flex-col gap-3 sm:flex-row sm:items-stretch"), "HomeMarketingClient.tsx");
add("CTA targets ≥ 44px", !/min-h-\[2\.(25|5)rem\][^"]*rounded-full bg-\[#7A1E2C\]/.test(homeClient), "HomeMarketingClient.tsx");

// --- Report
let failed = 0;
console.log("| Requirement | Status | Evidence |");
console.log("| --- | --- | --- |");
for (const r of rows) {
  if (r.status === "FAIL") failed += 1;
  console.log(`| ${r.requirement} | ${r.status} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed}/${rows.length} rows passing or informational; ${failed} failing.`);
if (failed > 0) process.exit(1);
