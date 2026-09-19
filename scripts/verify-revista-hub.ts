/**
 * Revista compact hub — focused verifier.
 *
 *   npm run verify:revista-hub
 *
 * Proves: the hub is exactly three sections (current magazine · sponsors · previous editions); the large HTML
 * preview, newsletter and advertise blocks are gone from /magazine but the dedicated reader/flipbook/PDF/translation
 * routes are intact; the archive is derived from the public manifest (no hand-kept list) and follows the real
 * issue lifecycle; sponsors are never invented; Home and the hub share one current-edition truth; ES/EN parity;
 * and nothing outside the Revista scope (Learning, Admin, migrations) changed.
 * No database, no network, no server.
 */
import assert from "node:assert";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CURRENT_MAGAZINE_EDITION, editionFromManifestEntry, magazineEditionHasDedicatedReader, magazineEditionMonthYear, magazineEditionReaderHref, resolveCurrentMagazineEdition } from "../app/lib/magazine/currentEdition";
import { MAGAZINE_HUB_EN, MAGAZINE_HUB_ES } from "../app/lib/magazine/magazineHubPageCopy/esEn";
import { getMagazineHubPageCopy } from "../app/lib/magazine/magazineHubPageCopy";
import { isOpenableEdition, magazineEditionKey, resolveEditionActions, resolveMagazineArchive } from "../app/lib/magazine/magazineHubModel";
import { buildManifestFromIssueRows } from "../app/lib/magazine/magazineManifestBuild";
import type { MagazineIssueRow, PublicMagazineManifest } from "../app/lib/magazine/magazineManifestTypes";
import { getMagazineEditionSponsors } from "../app/lib/magazine/magazineSponsors";

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

let passed = 0;
let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${(e as Error).message.split("\n")[0]}`);
  }
}

const HUB = "app/(site)/magazine/MagazineHubClient.tsx";
const PAGE = "app/(site)/magazine/page.tsx";
const hub = read(HUB);
const hubCode = stripComments(hub);

/* ---------------------------------------------------------------- fixtures */
let seq = 0;
function issue(over: Partial<MagazineIssueRow> & Pick<MagazineIssueRow, "year" | "month_slug">): MagazineIssueRow {
  seq += 1;
  const stamp = `2026-0${(seq % 9) + 1}-01T00:00:00.000Z`;
  return {
    id: `issue-${seq}`,
    title_es: `Revista ${over.month_slug} ${over.year}`,
    title_en: `${over.month_slug} ${over.year} Magazine`,
    status: "draft",
    is_featured: false,
    cover_url: `/magazine/${over.year}/${over.month_slug}/cover.png`,
    pdf_url: `/magazine/${over.year}/${over.month_slug}/issue.pdf`,
    flipbook_url: `https://flip.example.test/${over.year}-${over.month_slug}/`,
    published_at: stamp,
    display_order: 0,
    internal_notes: null,
    created_at: stamp,
    updated_at: stamp,
    ...over,
  };
}
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Mirrors setMagazineCurrentIssueAction's three row updates, in the action's order (asserted against the real source below). */
function applySetCurrent(rows: MagazineIssueRow[], id: string): MagazineIssueRow[] {
  const next = clone(rows);
  const target = next.find((r) => r.id === id);
  assert.ok(target && target.status === "published", "only a published issue can become current");
  for (const p of next) if (p.is_featured && p.status === "published" && p.id !== id) { p.status = "archived"; p.is_featured = false; }
  for (const r of next) if (r.is_featured) r.is_featured = false;
  target.is_featured = true;
  return next;
}
const manifestOf = (rows: MagazineIssueRow[]): PublicMagazineManifest => {
  const m = buildManifestFromIssueRows(rows);
  assert.ok(m, "a manifest is built");
  return m;
};

/* ------------------------------------------------------------------ checks */

check("IA: exactly three sections — current magazine · sponsors · previous editions; one h1", () => {
  assert.strictEqual((hubCode.match(/<section\b/g) ?? []).length, 3, "three <section> elements");
  assert.strictEqual((hubCode.match(/<h1\b/g) ?? []).length, 1);
  for (const id of ["magazine-hero-title", "magazine-current-title", "magazine-sponsors-title", "magazine-archive-title"]) assert.ok(hubCode.includes(id), id);
  for (const s of ['data-magazine-section="current"', 'data-magazine-section="sponsors"', 'data-magazine-section="archive"']) assert.ok(hubCode.includes(s), s);
  const order = ['data-magazine-section="current"', 'data-magazine-section="sponsors"', 'data-magazine-section="archive"'].map((k) => hubCode.indexOf(k));
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order, "render order: current → sponsors → archive");
});

check("Hub removals: no HTML preview, language selector, newsletter, advertise block, explainers or hardcoded archive", () => {
  for (const banned of ["MagazineTranslatedReader", "MagazineLanguageSelector", "AdvertiseDropdown", "PAST_EDITIONS", 'variant="preview"', "newsletter", "originalEditionNote", "futureFlipbookNote", "issuePageTitle", "openFullReader", "heroDescription"]) {
    assert.ok(!hubCode.includes(banned), `${HUB} must not contain ${banned}`);
  }
  assert.ok(!/<form\b/.test(hubCode), "no form on the hub");
  assert.ok(!/\/publicar/.test(hubCode) && !/\/publicar/.test(read("app/lib/magazine/magazineHubModel.ts")), "no legacy /publicar route");
  const buttons = (hubCode.match(/\{t\.readMagazine\}/g) ?? []).length;
  assert.ok(buttons <= 3 && !hubCode.includes("readMoreHref"), "the reader button is not repeated across blocks (one per action kind)");
});

check("Dedicated routes intact: full reader (variant full), translated reader component, issue page, flipbook modal, PDF, translation guidance", () => {
  const reader = read("app/(site)/magazine/2026/june/read/page.tsx");
  assert.ok(reader.includes("MagazineTranslatedReader") && reader.includes('variant="full"'), "the June reader still renders the full translated reader");
  assert.ok(exists("app/(site)/magazine/components/MagazineTranslatedReader.tsx") && exists("app/(site)/magazine/components/MagazineLanguageSelector.tsx"));
  assert.ok(read("app/(site)/magazine/2026/june/page.tsx").includes("MagazineLanguageSelector"), "the June issue page keeps its language selector");
  assert.ok(hubCode.includes("FullscreenFlipbookModal") && hubCode.includes("<iframe"), "flipbook viewer");
  assert.ok(hubCode.includes("download") && hubCode.includes("actions.pdfUrl"), "PDF download");
  assert.ok(hubCode.includes("magazineJune2026ReaderHref(lang, { source: \"print\" })"), "translation help points at the existing phone-camera guidance");
  assert.ok(read("app/(site)/magazine/2026/june/read/page.tsx").includes("source"), "the guidance route still handles source=print");
});

check("Archive is manifest-driven: server page resolves the manifest; hub derives current + archive from it; no second registry", () => {
  const page = read(PAGE);
  assert.ok(page.includes("resolvePublicMagazineManifest") && page.includes("manifest={manifest}"), "server-resolved manifest passed to the hub");
  assert.ok(hubCode.includes("resolveMagazineArchive(manifest, current)") && hubCode.includes("resolveCurrentMagazineEdition(manifest)"));
  assert.ok(!/const\s+PAST_EDITIONS|PAST_EDITIONS\s*[:=]/.test(hub), "the hardcoded empty PAST_EDITIONS array is gone");
  assert.ok(!/["'`](january|february|march|april|may|june|july|august|september|october|november|december)["'`]/i.test(hubCode), "no month list in the hub");
  assert.ok(!/fetch\(/.test(hubCode), "the hub no longer fetches its own copy of the manifest");
  assert.ok(read("app/api/magazine/manifest/route.ts").includes("resolvePublicMagazineManifest"), "the public manifest API is unchanged");
});

check("Lifecycle: A current → B published → B set current ⇒ A archived by the existing action ⇒ hub shows B current and A under Previous editions", () => {
  // Bind the mirror to the REAL admin action: archive prior featured → clear featured → set new featured.
  const action = read("app/admin/magazineIssuesActions.ts");
  const setCurrent = action.slice(action.indexOf("export async function setMagazineCurrentIssueAction"), action.indexOf("export async function archiveMagazineIssueAction"));
  const iArchive = setCurrent.indexOf('update({ status: "archived", is_featured: false');
  const iClear = setCurrent.indexOf('update({ is_featured: false, updated_at: now }).eq("is_featured", true)');
  const iSet = setCurrent.indexOf('update({ is_featured: true, updated_at: now })');
  assert.ok(iArchive > 0 && iClear > iArchive && iSet > iClear, "the admin action archives the previous featured issue, clears featured, then features the new one");
  assert.ok(setCurrent.includes('row.status !== "published"'), "only a published issue can become current");

  let rows = [
    issue({ year: "2026", month_slug: "june", status: "published", is_featured: true, display_order: 6 }),
    issue({ year: "2026", month_slug: "july", status: "draft", display_order: 7 }),
  ];
  // state 0 — one live issue: it is current, the archive is empty (section hidden)
  let m = manifestOf(rows);
  let current = resolveCurrentMagazineEdition(m);
  assert.strictEqual(magazineEditionKey(current), "2026/june");
  assert.deepStrictEqual(resolveMagazineArchive(m, current), []);

  // B is published but not current yet: it is upcoming — not a previous edition
  rows = rows.map((r) => (r.month_slug === "july" ? { ...r, status: "published" as const } : r));
  m = manifestOf(rows);
  current = resolveCurrentMagazineEdition(m);
  assert.strictEqual(magazineEditionKey(current), "2026/june", "publishing B does not change the current edition");
  assert.deepStrictEqual(resolveMagazineArchive(m, current), [], "a published, not-yet-current issue is not shown as previous");

  // set B current → the existing action archives A
  const b = rows.find((r) => r.month_slug === "july")!;
  rows = applySetCurrent(rows, b.id);
  assert.strictEqual(rows.find((r) => r.month_slug === "june")!.status, "archived");
  m = manifestOf(rows);
  assert.strictEqual(m.years["2026"].months.find((x) => x.month === "june")!.status, "archived", "the manifest reports A archived");
  current = resolveCurrentMagazineEdition(m);
  assert.strictEqual(magazineEditionKey(current), "2026/july", "the hub (and Home) now show B as current");
  assert.strictEqual(current.monthEn, "July");
  assert.strictEqual(magazineEditionMonthYear(current, "es"), "Julio 2026");
  const archive = resolveMagazineArchive(m, current);
  assert.deepStrictEqual(archive.map(magazineEditionKey), ["2026/june"], "A appears under Previous editions automatically");
  assert.ok(!archive.some((e) => magazineEditionKey(e) === magazineEditionKey(current)), "the current issue is never duplicated in the archive");
  assert.strictEqual(archive[0].coverImage, "/magazine/2026/june/cover.png");

  // …and one more turn of the wheel: C current → B archived, A stays
  rows.push(issue({ year: "2026", month_slug: "august", status: "published", display_order: 8 }));
  rows = applySetCurrent(rows, rows[rows.length - 1].id);
  m = manifestOf(rows);
  current = resolveCurrentMagazineEdition(m);
  assert.strictEqual(magazineEditionKey(current), "2026/august");
  assert.deepStrictEqual(resolveMagazineArchive(m, current).map(magazineEditionKey), ["2026/july", "2026/june"], "newest first");
});

check("Archive rules: ordering is deterministic (year ↓, display_order ↓, month ↓); manual archive works; drafts never appear; missing assets hide their buttons", () => {
  const rows = [
    issue({ year: "2026", month_slug: "august", status: "published", is_featured: true, display_order: 8 }),
    issue({ year: "2025", month_slug: "december", status: "archived", display_order: 12 }),
    issue({ year: "2026", month_slug: "february", status: "archived", display_order: 2 }),
    issue({ year: "2026", month_slug: "january", status: "archived", display_order: 1 }),
    issue({ year: "2026", month_slug: "march", status: "archived", display_order: 2 }),
    issue({ year: "2026", month_slug: "may", status: "draft", display_order: 5 }),
    issue({ year: "2026", month_slug: "april", status: "archived", flipbook_url: null, pdf_url: null }),
  ];
  const m = manifestOf(rows);
  const current = resolveCurrentMagazineEdition(m);
  const keys = resolveMagazineArchive(m, current).map(magazineEditionKey);
  assert.deepStrictEqual(keys, ["2026/march", "2026/february", "2026/january", "2025/december"], "year ↓, then display_order ↓ (march = february → later month first), then older year last; april (nothing to open) skipped");
  assert.ok(!keys.includes("2026/may"), "a draft never appears");
  assert.deepStrictEqual(resolveMagazineArchive(m, current).map(magazineEditionKey), resolveMagazineArchive(clone(m), current).map(magazineEditionKey), "deterministic");

  const noAssets = editionFromManifestEntry("2026", "april", { title: { es: "x", en: "x" }, coverUrl: null, pdfUrl: null, flipbookUrl: null });
  assert.ok(!isOpenableEdition(noAssets) && !keys.includes("2026/april"), "an archived issue with nothing to open is skipped — no dead card");
  const onlyPdf = resolveEditionActions(editionFromManifestEntry("2025", "december", { pdfUrl: "/x.pdf" }), "es");
  assert.deepStrictEqual([onlyPdf.primary?.kind, onlyPdf.flipbookUrl, onlyPdf.pdfUrl], ["pdf", null, null], "PDF only: one Read button, no duplicate download, no flipbook button");
  const onlyFlip = resolveEditionActions(editionFromManifestEntry("2025", "december", { flipbookUrl: "https://f.test/" }), "es");
  assert.deepStrictEqual([onlyFlip.primary?.kind, onlyFlip.pdfUrl], ["flipbook", null], "flipbook only: no PDF button");
  const both = resolveEditionActions(editionFromManifestEntry("2025", "december", { flipbookUrl: "https://f.test/", pdfUrl: "/x.pdf" }), "es");
  assert.deepStrictEqual([both.primary?.kind, both.pdfUrl], ["flipbook", "/x.pdf"]);
  assert.deepStrictEqual(resolveEditionActions(noAssets, "es"), { primary: null, flipbookUrl: null, pdfUrl: null });
});

check("Editions.json fallback (file manifest): the one live issue is current, archive stays empty; a non-current file entry with nothing to open is not shown", () => {
  const fileManifest: PublicMagazineManifest = {
    source: "file",
    featured: { year: "2026", month: "june", title: { es: "Revista Junio 2026", en: "June 2026 Magazine" }, coverUrl: null, pdfUrl: null, flipbookUrl: null },
    years: { "2026": { months: [{ month: "june", title: { es: "a", en: "a" } }, { month: "january", title: { es: "Enero", en: "January" } }] } },
  };
  const cur = resolveCurrentMagazineEdition(fileManifest);
  assert.strictEqual(magazineEditionKey(cur), "2026/june");
  assert.strictEqual(cur.coverImage, CURRENT_MAGAZINE_EDITION.coverImage, "the base June issue keeps its base assets");
  assert.deepStrictEqual(resolveMagazineArchive(fileManifest, cur), []);
  assert.deepStrictEqual(resolveMagazineArchive(null, cur), []);
  assert.strictEqual(magazineEditionKey(resolveCurrentMagazineEdition(null)), "2026/june");
  assert.strictEqual(magazineEditionKey(resolveCurrentMagazineEdition(undefined)), "2026/june");
});

check("Current-edition truth is ONE module: Home, the hub and the manifest all resolve through currentEdition.ts; no other edition record", () => {
  const home = read("app/(site)/home/HomeMarketingClient.tsx");
  const homePage = read("app/(site)/home/page.tsx");
  assert.ok(home.includes('from "@/app/lib/magazine/currentEdition"') && homePage.includes("resolveCurrentMagazineEdition") && homePage.includes("resolvePublicMagazineManifest"));
  assert.ok(hub.includes('from "@/app/lib/magazine/currentEdition"') && hubCode.includes("resolveCurrentMagazineEdition"));
  assert.strictEqual((read("app/lib/magazine/currentEdition.ts").match(/CURRENT_MAGAZINE_EDITION: MagazineEdition = \{/g) ?? []).length, 1, "one base record");
  assert.ok(!/titleEs: "/.test(hub), "no edition record in the hub");
  // Same manifest ⇒ same edition, whichever surface asks.
  const m = manifestOf([issue({ year: "2026", month_slug: "june", status: "published", is_featured: true }), issue({ year: "2026", month_slug: "july", status: "published" })]);
  assert.deepStrictEqual(resolveCurrentMagazineEdition(m), resolveCurrentMagazineEdition(clone(m)));
  // Home's June CTA is byte-for-byte what it was; a current issue with no dedicated reader never links to a placeholder page.
  assert.strictEqual(magazineEditionReaderHref(CURRENT_MAGAZINE_EDITION, "es"), "/magazine/2026/june/read?lang=es");
  assert.ok(magazineEditionHasDedicatedReader(CURRENT_MAGAZINE_EDITION));
  const july = editionFromManifestEntry("2026", "july", { flipbookUrl: "https://f.test/" });
  assert.strictEqual(magazineEditionReaderHref(july, "en"), "/magazine?lang=en", "no dedicated reader ⇒ the hub (which opens the flipbook), never a placeholder route");
  assert.strictEqual(resolveEditionActions(july, "en").primary?.kind, "flipbook");
  assert.strictEqual(july.coverImage, "/magazine/2026/july/cover.png", "another issue's cover is never substituted");
});

check("Current magazine: the June 2026 edition is unchanged (label, cover mapping, PDF, flipbook, reader) — the cover-artwork debt is not touched", () => {
  assert.strictEqual(CURRENT_MAGAZINE_EDITION.monthKey, "june");
  assert.strictEqual(CURRENT_MAGAZINE_EDITION.year, "2026");
  assert.strictEqual(CURRENT_MAGAZINE_EDITION.coverImage, "/magazine/2026/june/cover.png");
  assert.strictEqual(CURRENT_MAGAZINE_EDITION.pdfUrl, "/magazine/2026/june/leonix_media_june.pdf");
  assert.strictEqual(magazineEditionMonthYear(CURRENT_MAGAZINE_EDITION, "es"), "Junio 2026");
  assert.strictEqual(magazineEditionMonthYear(CURRENT_MAGAZINE_EDITION, "en"), "June 2026");
  const editions = JSON.parse(read("public/magazine/editions.json")) as { featured: { year: string; month: string } };
  assert.deepStrictEqual([editions.featured.year, editions.featured.month], ["2026", "june"], "editions.json still features June 2026");
  const a = resolveEditionActions(CURRENT_MAGAZINE_EDITION, "es");
  assert.strictEqual(a.primary?.kind, "reader");
  assert.strictEqual(a.flipbookUrl, CURRENT_MAGAZINE_EDITION.flipbookUrl);
  assert.strictEqual(a.pdfUrl, CURRENT_MAGAZINE_EDITION.pdfUrl);
});

check("Sponsors: no issue-specific source exists ⇒ a truthful empty state; nothing is invented or inferred", () => {
  assert.deepStrictEqual(getMagazineEditionSponsors(CURRENT_MAGAZINE_EDITION), []);
  const src = stripComments(read("app/lib/magazine/magazineSponsors.ts"));
  assert.ok(!/https?:\/\//.test(src) && !/logoUrl:\s*["'`]/.test(src) && !/name:\s*["'`]/.test(src), "no sponsor names, logos or URLs in code");
  assert.ok(/return \[\];/.test(src), "the seam returns an empty list");
  for (const banned of ["featuredBusinesses", "getPopulatedFeaturedBusinesses", "oferta", "advertiser", "premium"]) assert.ok(!hubCode.includes(banned), `the hub must not infer sponsors from ${banned}`);
  assert.ok(hubCode.includes("sponsors.length === 0") && hubCode.includes("copy.sponsorsEmpty") && hubCode.includes("copy.sponsorsCta"), "empty state + compact media-kit CTA");
  const page = read(PAGE);
  assert.ok(page.includes("getMagazineEditionSponsors(resolveCurrentMagazineEdition(manifest))") && page.includes("sponsors={sponsors}"), "sponsors are resolved on the server from the canonical source and passed in");
  assert.ok(!hubCode.includes("getMagazineEditionSponsors") && !/sponsors\s*=\s*\[\s*\{/.test(hubCode + page), "the hub never defines sponsors itself");
  assert.ok(hubCode.includes('sponsored noopener'), "a real sponsor link would be rel=sponsored");
  assert.strictEqual(MAGAZINE_HUB_ES.sponsorsTitle, "Patrocinadores de esta edición");
  assert.strictEqual(MAGAZINE_HUB_ES.sponsorsEmpty, "Espacios de patrocinio disponibles.");
  assert.strictEqual(MAGAZINE_HUB_EN.sponsorsTitle, "Sponsors of this edition");
  assert.strictEqual(MAGAZINE_HUB_EN.sponsorsEmpty, "Sponsorship opportunities available.");
});

check("Copy: Spanish primary, English at full parity, short, no marketing paragraphs; other languages fall back to English", () => {
  const es = MAGAZINE_HUB_ES as Record<string, string>;
  const en = MAGAZINE_HUB_EN as Record<string, string>;
  assert.deepStrictEqual(Object.keys(es).sort(), Object.keys(en).sort(), "same keys");
  for (const k of Object.keys(es)) {
    assert.ok(es[k].trim() && en[k].trim(), `${k}: both languages`);
    assert.ok(es[k].length <= 80 && en[k].length <= 80, `${k}: compact (${es[k].length}/${en[k].length})`);
  }
  assert.strictEqual(es.subtitle, "Historias, comunidad, negocios, cultura y recursos de nuestra gente.");
  assert.strictEqual(en.subtitle, "Stories, community, business, culture and resources for our community.");
  assert.strictEqual(es.archiveTitle, "Ediciones anteriores");
  assert.strictEqual(en.archiveTitle, "Previous editions");
  assert.ok(es.translateHelp === "¿Necesitas traducirla?" && en.translateHelp === "Need it translated?");
  assert.ok(/[áéíóúñ¿]/.test(Object.values(es).join("")), "Spanish is accented");
  assert.strictEqual(getMagazineHubPageCopy("es"), MAGAZINE_HUB_ES);
  assert.strictEqual(getMagazineHubPageCopy("en"), MAGAZINE_HUB_EN);
  assert.strictEqual(getMagazineHubPageCopy("pt"), MAGAZINE_HUB_EN);
  assert.ok(!exists("app/lib/magazine/magazineHubPageCopy/communityBuilder.ts"), "unused per-language marketing copy retired");
});

check("Mobile-first layout: cover is the focal point, buttons are 44px+, no horizontal overflow risk, page uses one narrow column of sections", () => {
  assert.ok(hubCode.includes("overflow-x-clip") && !hubCode.includes("overflow-x-hidden"), "clip (not hidden) so nothing else breaks");
  assert.ok(/min-h-12/.test(hubCode) && !/min-h-\[2\.5rem\]/.test(hubCode), "primary controls are 48px, not 40px");
  assert.ok(hubCode.includes("grid-cols-2") && hubCode.includes("lg:grid-cols-4"), "archive is a compact 2 → 3 → 4 column grid");
  assert.ok(hubCode.includes("max-w-5xl"), "one contained column");
  assert.ok(read("app/(site)/magazine/components/MagazineCover.tsx").includes("onError") && read("app/(site)/magazine/components/MagazineCover.tsx").includes("role=\"img\""), "a missing cover degrades to a typographic card, never a broken image");
  assert.ok(hub.split("\n").length < 320, "the hub file is short (the old hub was 449 lines with an HTML preview, newsletter and advertise block)");
});

check("Manifest: additive fields only; pure builder re-exported by the server module; database ⇄ file behaviour unchanged", () => {
  const types = read("app/lib/magazine/magazineManifestTypes.ts");
  assert.ok(types.includes('status?: "published" | "archived"') && types.includes("displayOrder?: number"));
  const server = read("app/lib/magazine/magazineManifestServer.ts");
  assert.ok(server.includes('from "./magazineManifestBuild"') && server.includes("export { buildManifestFromIssueRows }") && server.includes('import "server-only"'));
  const build = read("app/lib/magazine/magazineManifestBuild.ts");
  assert.ok(!stripComments(build).includes("server-only") && !build.includes("supabase"), "the builder is pure (no server-only, no Supabase)");
  const m = manifestOf([issue({ year: "2026", month_slug: "june", status: "published", is_featured: true }), issue({ year: "2026", month_slug: "may", status: "archived" }), issue({ year: "2026", month_slug: "july", status: "draft" })]);
  assert.strictEqual(m.source, "database");
  assert.deepStrictEqual(m.years["2026"].months.map((x) => x.month).sort(), ["june", "may"], "drafts are not public");
  assert.strictEqual(buildManifestFromIssueRows([issue({ year: "2026", month_slug: "june", status: "draft" })]), null);
});

/* ---------------------------------------------------------------- scope */
function git(cmd: string): string | null {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}
check("Scope: no Learning, Admin, migration, Home or BR/Rentas file changed; Revista work only", () => {
  const tracked = git("diff --name-only origin/main");
  const untracked = git("ls-files --others --exclude-standard");
  if (tracked === null || untracked === null) {
    console.log("        (git or origin/main unavailable — scope check skipped)");
    return;
  }
  const files = [...tracked.split("\n"), ...untracked.split("\n")].map((f) => f.trim()).filter((f) => f && !f.startsWith(".claude/"));
  const forbidden = files.filter((f) => /^app\/\(site\)\/aprender|^app\/lib\/business\/learning|reviewed-seeds|learning-center/.test(f) || /^supabase\/migrations\//.test(f) || /^app\/admin\//.test(f) || /^app\/\(site\)\/home\//.test(f) || /^app\/components\/(Navbar|AdvertiseDropdown)/.test(f) || /rentas|bienes-raices/i.test(f));
  assert.deepStrictEqual(forbidden, [], "out-of-scope files changed");
});

console.log(`\n${passed + failed} check(s): ${passed} passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) process.exit(1);
console.log("\nAll checks passed.");
