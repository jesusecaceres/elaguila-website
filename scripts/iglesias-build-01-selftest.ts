/**
 * Iglesias BUILD 01 self-test.
 * Run: npx tsx scripts/iglesias-build-01-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { IGLESIAS_NEED_CATALOG, IGLESIAS_NEED_KEYS, isIglesiasNeedKey } from "../app/lib/iglesias/taxonomy";
import { isPublicChurchEligible } from "../app/lib/iglesias/eligibility";
import { parseIglesiasBrowseState, buildIglesiasHref } from "../app/lib/iglesias/queryParams";
import { slugifyIglesiasName } from "../app/lib/iglesias/slug";
import { parseChurchApplication } from "../app/lib/iglesias/churchApplicationParse";
import { iglesiasLocationMatches, iglesiasLocationTerm } from "../app/lib/iglesias/location";
import { iglesiasVisibleNeedImageSrc, IGLESIAS_NEED_TILES_WITHOUT_UNIQUE_PHOTO } from "../app/lib/iglesias/images";

const ROOT = path.resolve(__dirname, "..");
function src(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(IGLESIAS_NEED_KEYS.length, 16);
  assert.ok(isIglesiasNeedKey("PRAYER"));
  assert.equal(isIglesiasNeedKey("YOUTH_GROUP"), false);

  assert.equal(isPublicChurchEligible({ approval_status: "pending", is_active: true, published_at: "2026-01-01" }), false);
  assert.equal(isPublicChurchEligible({ approval_status: "approved", is_active: false, published_at: "2026-01-01" }), false);
  assert.equal(isPublicChurchEligible({ approval_status: "approved", is_active: true, published_at: null }), false);
  assert.equal(isPublicChurchEligible({ approval_status: "approved", is_active: true, published_at: "2026-01-01" }), true);

  const sp = new URLSearchParams("lang=en&q=vida&need=YOUTH&language=es&city=San+Jose");
  const browse = parseIglesiasBrowseState(sp);
  assert.equal(browse.q, "vida");
  assert.equal(browse.need, "YOUTH");
  assert.equal(browse.language, "es");
  assert.equal(browse.city, "San Jose");
  const href = buildIglesiasHref(browse, "en");
  assert.ok(href.includes("lang=en"));
  assert.ok(href.includes("need=YOUTH"));
  assert.ok(!href.includes("lang=es&lang="));

  assert.ok(slugifyIglesiasName("Iglesia Vida Nueva", "San José").includes("iglesia-vida-nueva"));

  const bad = parseChurchApplication({ name: "A", applicantEmail: "x" });
  assert.equal(bad.ok, false);
  const good = parseChurchApplication({
    name: "Iglesia Esperanza",
    applicantEmail: "pastor@example.com",
    publicLocation: false,
    languages: ["es"],
    ministries: ["YOUTH", "bogus"],
  });
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.deepEqual(good.data.ministries, ["YOUTH"]);
  }

  const landing = src("app/(site)/iglesias/page.tsx");
  assert.ok(!landing.includes("CategoryCompactHero"));
  assert.ok(!landing.includes("CategoryStandardLandingPageShell"));
  assert.ok(landing.includes("IglesiasLandingView"));
  assert.equal(existsSync(path.join(ROOT, "app/(site)/iglesias/IglesiasPageClient.tsx")), false);

  const migration = src("supabase/migrations/20260819120000_iglesias_churches.sql");
  assert.ok(migration.includes("create table if not exists public.churches"));
  assert.ok(migration.includes("church_services"));
  assert.ok(migration.includes("church_ministries"));
  assert.ok(migration.includes("church_media"));
  assert.ok(migration.includes("church_submissions"));
  assert.ok(!/create table if not exists public\.prayer_requests/i.test(migration));
  assert.ok(!/create table if not exists public\.prayer_acknowledgements/i.test(migration));
  assert.ok(!/Pennsylvania|Philadelphia/i.test(migration));

  const allIglesiasLib = src("app/lib/iglesias/churchQueries.ts") + src("app/lib/iglesias/churchApplication.ts") + landing;
  assert.ok(!allIglesiasLib.includes("user_liked_listings"));
  assert.ok(!allIglesiasLib.includes("listing_moderation_reviews"));
  assert.ok(!/fake church|sample congregation|QA_FALLBACK_CHURCH/i.test(allIglesiasLib));

  assert.ok(existsSync(path.join(ROOT, "public/iglesias/editorial/hero-community.jpg")));
  assert.ok(existsSync(path.join(ROOT, "public/iglesias/fallbacks/community-neutral.jpg")));

  const registrar = src("app/(site)/iglesias/registrar/page.tsx");
  assert.ok(registrar.includes("IglesiasRegistrarForm"));

  const landingView = src("app/(site)/iglesias/IglesiasLandingView.tsx");
  assert.ok(!landingView.includes("cms.subtitle"));
  assert.ok(!landingView.includes("trustBody: cms"));
  assert.ok(landingView.includes("IglesiasPrayerLane"));
  assert.ok(!landingView.includes("IglesiasPrayerComing"));
  assert.ok(!/people are praying|personas orando ahora|instant prayer team/i.test(landingView));

  const prayerLane = src("app/(site)/iglesias/components/IglesiasPrayerLane.tsx");
  assert.ok(prayerLane.includes("IglesiasPrayerForm"));
  assert.ok(!prayerLane.includes("comingSoon"));

  const copySrc = src("app/lib/iglesias/copy.ts");
  assert.ok(copySrc.includes("You are not alone"));
  assert.ok(copySrc.includes("No estás solo"));
  assert.ok(copySrc.includes("Prayer is for everyone"));
  assert.ok(copySrc.includes("Ciudad, estado, país o código postal"));
  assert.ok(copySrc.includes("City, state, country, or postal code"));
  assert.ok(!/worldwide church network|red mundial de iglesias|people prayed today/i.test(copySrc));

  const locChurch = {
    city: "San José",
    state: "California",
    country: "United States",
    zip: "95110",
  };
  assert.equal(iglesiasLocationMatches(locChurch, "San José"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "San Jose"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "California"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "CA"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "95110"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "United States"), true);
  assert.equal(iglesiasLocationMatches(locChurch, "USA"), false);
  assert.equal(iglesiasLocationMatches(locChurch, "Texas"), false);
  assert.equal(iglesiasLocationMatches(locChurch, ""), true);

  const locBrowse = parseIglesiasBrowseState(new URLSearchParams("lang=es&city=California&need=YOUTH&language=es"));
  assert.equal(locBrowse.city, "California");
  assert.equal(locBrowse.need, "YOUTH");
  assert.equal(locBrowse.language, "es");
  assert.equal(iglesiasLocationTerm(locBrowse.city, locBrowse.zip), "California");
  const zipBrowse = parseIglesiasBrowseState(new URLSearchParams("city=95110"));
  assert.equal(zipBrowse.zip, "95110");
  assert.equal(iglesiasLocationMatches(locChurch, iglesiasLocationTerm(zipBrowse.city, zipBrowse.zip)), true);

  const countryApp = parseChurchApplication({
    name: "Iglesia Esperanza",
    applicantEmail: "pastor@example.com",
    publicLocation: false,
    languages: ["es"],
    city: "San José",
    state: "California",
    country: "United States",
    zip: "95110",
  });
  assert.equal(countryApp.ok, true);
  if (countryApp.ok) {
    assert.equal(countryApp.data.country, "United States");
    assert.equal(countryApp.data.state, "California");
  }

  const landingKeys = IGLESIAS_NEED_CATALOG.filter((n) => n.landingTile).map((n) => n.key);
  const assigned = landingKeys.map((key) => iglesiasVisibleNeedImageSrc(key)).filter((src): src is string => Boolean(src));
  assert.equal(assigned.length, landingKeys.length);
  assert.equal(new Set(assigned).size, assigned.length);
  assert.equal(iglesiasVisibleNeedImageSrc("PRAYER"), "/iglesias/editorial/need-prayer.jpg");
  assert.equal(iglesiasVisibleNeedImageSrc("MARRIAGE"), "/iglesias/editorial/need-marriage.jpg");
  assert.equal(iglesiasVisibleNeedImageSrc("GRIEF"), "/iglesias/editorial/need-grief.jpg");
  assert.equal(iglesiasVisibleNeedImageSrc("SPANISH_SERVICE"), "/iglesias/editorial/need-spanish-service.jpg");
  assert.equal(iglesiasVisibleNeedImageSrc("RECOVERY"), "/iglesias/editorial/need-recovery.jpg");
  assert.equal(IGLESIAS_NEED_TILES_WITHOUT_UNIQUE_PHOTO.length, 0);
  for (const src of assigned) {
    assert.ok(existsSync(path.join(ROOT, "public", src.replace(/^\//, ""))), src);
  }

  const seo = src("app/lib/leonix/publicPillarSeo.ts");
  assert.ok(!/directorio gratuito y neutral de iglesias y comunidades de fe en San José\. Leonix no vende rankings/i.test(seo));

  console.log("iglesias-build-01-selftest: PASS");
}

main();
