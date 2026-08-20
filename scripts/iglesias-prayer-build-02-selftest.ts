/**
 * Iglesias BUILD 02 self-test — privacy, moderation routing, RLS contract, admin permission.
 * Run: npx tsx scripts/iglesias-prayer-build-02-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { mapPublicPrayer, isPubliclyListablePrayer, publicPrayerHasForbiddenKeys, visibilityIsPrivate } from "../app/lib/iglesias/prayerPublicMapper";
import type { PrayerModerationStatus, PrayerStatus } from "../app/lib/iglesias/prayerTypes";
import { parsePrayerSubmission, isMeaningfulPrayerBody } from "../app/lib/iglesias/prayerValidation";
import { classifyPrayerSafetyDeterministic } from "../app/lib/iglesias/prayerSafetyAdapter";
import { routePrayerSafetyDecision, emptySafetyResult } from "../app/lib/iglesias/prayerSafetyRouting";
import { checkIglesiasPrayerRateLimit, __resetIglesiasPrayerRateLimitForTests } from "../app/lib/iglesias/prayerRateLimit";
import { adminCanManagePrayerWall } from "../app/admin/_lib/prayerPermission";
import { PRAYER_CATEGORY_KEYS } from "../app/lib/iglesias/prayerTaxonomy";
import { getPrayerUiCopy } from "../app/lib/iglesias/prayerCopy";
import { ALL_ADMIN_PERMISSION_KEYS } from "../app/admin/_lib/teamTypes";

const ROOT = path.resolve(__dirname, "..");
function src(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function baseRow(over: {
  visibility?: "PUBLIC_NAMED" | "PUBLIC_ANONYMOUS" | "PRIVATE_PRAYER_TEAM";
  display_name?: string | null;
  submitter_user_id?: string;
  contact_email?: string;
  moderation_status?: PrayerModerationStatus;
  status?: PrayerStatus;
  published_at?: string | null;
} = {}) {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    visibility: "PUBLIC_NAMED" as const,
    language: "es" as const,
    city: "San José",
    category: "FAMILY" as const,
    display_name: "Maria",
    body: "Please pray for my family while my mother recovers at home.",
    status: "OPEN" as const,
    created_at: "2026-08-19T12:00:00.000Z",
    moderation_status: "CLEARLY_SAFE" as PrayerModerationStatus,
    published_at: "2026-08-19T12:00:00.000Z",
    ...over,
  };
}

function main() {
  assert.equal(PRAYER_CATEGORY_KEYS.length, 12);

  const named = mapPublicPrayer({
    row: baseRow(),
    acknowledgementCount: 3,
    latestUpdate: null,
    owned: false,
    acknowledgedByViewer: false,
  });
  assert.ok(named);
  assert.equal(named!.displayName, "Maria");
  assert.equal(named!.anonymous, false);
  assert.equal(named!.acknowledgementCount, 3);
  assert.equal(publicPrayerHasForbiddenKeys(named).length, 0);

  const anon = mapPublicPrayer({
    row: baseRow({
      visibility: "PUBLIC_ANONYMOUS",
      display_name: "ShouldNeverShow",
      submitter_user_id: "user-uuid",
    }),
    acknowledgementCount: 1,
    latestUpdate: null,
    owned: false,
    acknowledgedByViewer: false,
  });
  assert.ok(anon);
  assert.equal(anon!.displayName, "Anónimo");
  assert.equal(anon!.anonymous, true);
  const anonJson = JSON.stringify(anon);
  assert.ok(!anonJson.includes("ShouldNeverShow"));
  assert.ok(!anonJson.includes("user-uuid"));
  assert.ok(!anonJson.includes("submitter_user_id"));
  assert.equal(publicPrayerHasForbiddenKeys(anon).length, 0);

  const leakProbe = {
    id: "x",
    submitter_user_id: "u",
    email: "a@b.c",
    phone: "555",
    whatsapp: "555",
    anonymous_session_hash: "abc",
    ip: "1.1.1.1",
    ai_decision: "CLEARLY_SAFE",
    reason_codes: ["x"],
  };
  const leaked = publicPrayerHasForbiddenKeys(leakProbe);
  assert.ok(leaked.includes("submitter_user_id"));
  assert.ok(leaked.includes("email"));
  assert.ok(leaked.includes("phone"));
  assert.ok(leaked.includes("whatsapp"));
  assert.ok(leaked.includes("anonymous_session_hash"));
  assert.ok(leaked.includes("ip"));
  assert.ok(leaked.includes("ai_decision"));
  assert.ok(leaked.includes("reason_codes"));

  const privateRow = baseRow({
    visibility: "PRIVATE_PRAYER_TEAM",
    contact_email: "hidden@example.com",
    moderation_status: "CLEARLY_SAFE",
    published_at: "2026-08-19T12:00:00.000Z",
  });
  assert.equal(visibilityIsPrivate("PRIVATE_PRAYER_TEAM"), true);
  assert.equal(isPubliclyListablePrayer(privateRow), false);
  assert.equal(
    mapPublicPrayer({
      row: privateRow,
      acknowledgementCount: 99,
      latestUpdate: null,
      owned: true,
      acknowledgedByViewer: true,
    }),
    null,
  );

  for (const status of ["PENDING", "HUMAN_REVIEW", "DISALLOWED", "CRISIS_REVIEW"] as const) {
    assert.equal(
      isPubliclyListablePrayer(baseRow({ moderation_status: status })),
      false,
      status,
    );
  }
  assert.equal(isPubliclyListablePrayer(baseRow({ status: "REMOVED", moderation_status: "CLEARLY_SAFE" })), false);
  assert.equal(isPubliclyListablePrayer(baseRow({ status: "MODERATION_HOLD", moderation_status: "CLEARLY_SAFE" })), false);
  assert.equal(isPubliclyListablePrayer(baseRow({ published_at: null })), false);

  const safe = classifyPrayerSafetyDeterministic("Please pray for my family while my mother recovers.");
  assert.equal(safe.decision, "CLEARLY_SAFE");
  assert.equal(routePrayerSafetyDecision(safe.decision, "PUBLIC_NAMED").outcome, "PUBLISHED");

  const grief = classifyPrayerSafetyDeterministic("I lost my father and I am angry and confused.");
  assert.equal(grief.decision, "CLEARLY_SAFE");

  const doubt = classifyPrayerSafetyDeterministic("I don’t know if I believe in God anymore but please pray for me.");
  assert.equal(doubt.decision, "CLEARLY_SAFE");

  const pii = classifyPrayerSafetyDeterministic(
    "Please pray for me. Call 555-010-9999 at 123 Main Street Apt 4.",
  );
  assert.equal(pii.decision, "UNCERTAIN");
  assert.equal(pii.contains_private_info, true);
  assert.equal(routePrayerSafetyDecision(pii.decision, "PUBLIC_NAMED").moderation_status, "HUMAN_REVIEW");
  assert.equal(routePrayerSafetyDecision(pii.decision, "PUBLIC_NAMED").publish, false);

  const disallowed = classifyPrayerSafetyDeterministic("Kill all of them and gas the neighborhood tonight.");
  assert.equal(disallowed.decision, "CLEARLY_DISALLOWED");
  assert.equal(routePrayerSafetyDecision(disallowed.decision, "PUBLIC_NAMED").moderation_status, "DISALLOWED");
  assert.equal(routePrayerSafetyDecision(disallowed.decision, "PUBLIC_NAMED").publish, false);

  const crisis = classifyPrayerSafetyDeterministic("I am going to kill myself tonight and I have a plan.");
  assert.equal(crisis.decision, "HIGH_RISK");
  const crisisRoute = routePrayerSafetyDecision(crisis.decision, "PUBLIC_NAMED");
  assert.equal(crisisRoute.moderation_status, "CRISIS_REVIEW");
  assert.equal(crisisRoute.status, "MODERATION_HOLD");
  assert.equal(crisisRoute.publish, false);

  const failClosed = emptySafetyResult("ai_failure");
  assert.equal(failClosed.decision, "UNCERTAIN");
  assert.equal(routePrayerSafetyDecision(failClosed.decision, "PUBLIC_NAMED").moderation_status, "HUMAN_REVIEW");
  assert.equal(routePrayerSafetyDecision(failClosed.decision, "PUBLIC_NAMED").publish, false);
  assert.equal(routePrayerSafetyDecision("CLEARLY_SAFE", "PRIVATE_PRAYER_TEAM").publish, false);
  assert.equal(routePrayerSafetyDecision("CLEARLY_SAFE", "PRIVATE_PRAYER_TEAM").outcome, "PRIVATE_RECEIVED");

  const parsed = parsePrayerSubmission({
    body: "Please pray for my family while my mother recovers at home.",
    visibility: "PUBLIC_ANONYMOUS",
    language: "es",
  });
  assert.equal(parsed.ok, true);
  assert.equal(isMeaningfulPrayerBody("ok"), false);
  const spam = parsePrayerSubmission({ body: "   ", visibility: "PUBLIC_NAMED", language: "es" });
  assert.equal(spam.ok, false);

  __resetIglesiasPrayerRateLimitForTests();
  for (let i = 0; i < 5; i++) {
    assert.equal(checkIglesiasPrayerRateLimit({ action: "submit", key: "t" }).allowed, true);
  }
  assert.equal(checkIglesiasPrayerRateLimit({ action: "submit", key: "t" }).allowed, false);

  assert.equal(ALL_ADMIN_PERMISSION_KEYS.includes("can_manage_prayer_wall"), true);
  assert.equal(
    adminCanManagePrayerWall({ enforceRoster: true, role: "ads_moderator", permissions: ["can_manage_ads"] }),
    false,
  );
  assert.equal(
    adminCanManagePrayerWall({
      enforceRoster: true,
      role: "ads_moderator",
      permissions: ["can_manage_prayer_wall"],
    }),
    true,
  );
  assert.equal(adminCanManagePrayerWall({ enforceRoster: true, role: "super_admin", permissions: [] }), true);
  assert.equal(adminCanManagePrayerWall({ enforceRoster: false, role: null, permissions: [] }), true);

  const es = getPrayerUiCopy("es");
  const en = getPrayerUiCopy("en");
  assert.ok(es.emptyWall.includes("No hay peticiones públicas todavía"));
  assert.ok(en.emptyWall.includes("There are no public prayer requests yet"));
  assert.ok(es.outcomePrivate.includes("forma segura"));
  assert.ok(!es.outcomePrivate.toLowerCase().includes("iglesia recib"));
  assert.ok(!en.outcomePrivate.toLowerCase().includes("churches received"));
  assert.ok(es.outcomeCrisisSupport.includes("servicios de emergencia locales"));
  assert.ok(en.outcomeCrisisSupport.includes("local emergency services"));
  assert.ok(!/\b988\b|\b911\b/.test(es.outcomeCrisisSupport + en.outcomeCrisisSupport));
  assert.equal(es.imPraying, "Estoy orando");
  assert.equal(en.imPraying, "I’m praying");

  const migration = src("supabase/migrations/20260819185941_iglesias_prayer.sql");
  for (const table of [
    "prayer_requests",
    "prayer_acknowledgements",
    "prayer_updates",
    "prayer_moderation_events",
    "prayer_reports",
  ]) {
    assert.ok(migration.includes(`create table if not exists public.${table}`), table);
    assert.ok(migration.includes(`alter table public.${table} enable row level security`), `${table} rls`);
  }
  assert.ok(migration.includes("revoke all on table public.prayer_requests from anon, authenticated"));
  assert.ok(migration.includes("revoke all on table public.prayer_acknowledgements from anon, authenticated"));
  assert.ok(migration.includes("revoke all on table public.prayer_moderation_events from anon, authenticated"));
  assert.ok(migration.includes("revoke all on table public.prayer_reports from anon, authenticated"));
  assert.ok(!migration.includes("grant select (") || !/grant select \([^)]*contact_email/.test(migration));
  assert.ok(!migration.includes("user_liked_listings"));
  assert.ok(!migration.includes("listing_moderation_reviews"));
  assert.ok(!migration.includes("prayer_network_deliver"));

  const service = src("app/lib/iglesias/prayerService.ts") + src("app/lib/iglesias/prayerPublicMapper.ts");
  assert.ok(!service.includes("user_liked_listings"));
  assert.ok(src("app/lib/iglesias/prayerService.ts").includes("prayer_acknowledgements"));

  const wall = src("app/(site)/iglesias/components/IglesiasPrayerLane.tsx");
  assert.ok(wall.includes("IglesiasPrayerForm"));
  assert.ok(!/trending|most prayed|leaderboard|paid boost/i.test(wall));
  const card = src("app/(site)/iglesias/components/IglesiasPrayerCard.tsx");
  assert.ok(card.includes("Estoy orando") === false);
  assert.ok(card.includes("imPraying"));
  assert.ok(!card.includes("heart"));
  assert.ok(card.includes("<article"));
  assert.ok(card.includes('type="button"'));

  assert.ok(existsSync(path.join(ROOT, "app/admin/iglesiasPrayerActions.ts")));
  const actions = src("app/admin/iglesiasPrayerActions.ts");
  for (const a of ["APPROVE", "REJECT", "REMOVE", "REDACT_PII_AND_APPROVE", "CLOSE", "MARK_REVIEWED"]) {
    assert.ok(actions.includes(a), a);
  }
  assert.ok(actions.includes("prayer_moderation_events"));

  const navbar = src("app/components/Navbar.tsx");
  const footer = src("app/components/Footer.tsx");
  assert.ok(!navbar.toLowerCase().includes("prayer_requests"));
  assert.ok(!footer.toLowerCase().includes("prayer_requests"));

  console.log("iglesias-prayer-build-02-selftest: PASS");
}

main();
