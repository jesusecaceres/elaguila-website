/**
 * Iglesias BUILD 03 self-test — Prayer Network routing, privacy, moderation, monetization firewall.
 * Run: npx tsx scripts/iglesias-prayer-network-build-03-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  MAX_PRAYER_DELIVERY_ATTEMPTS,
  MAX_PRAYER_TEAM_RECIPIENTS,
  canRetryPrayerDelivery,
  isPrayerNetworkRoutable,
  isPublicPrayerNetworkParticipant,
  mapPrayerTeamDeliveryPayload,
  prayerDeliveryPayloadHasForbiddenKeys,
  prayerNetworkEmailSubject,
  selectPrayerNetworkTeams,
  type PrayerRoutingRequest,
  type PrayerTeamCandidate,
} from "../app/lib/iglesias/prayerNetworkRouting";
import { getPrayerUiCopy } from "../app/lib/iglesias/prayerCopy";
import { getIglesiasCopy } from "../app/lib/iglesias/copy";

const ROOT = path.resolve(__dirname, "..");
function src(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function team(over: Partial<PrayerTeamCandidate> & Pick<PrayerTeamCandidate, "teamId" | "churchId">): PrayerTeamCandidate {
  return {
    churchName: over.churchName ?? `Church ${over.churchId}`,
    enabled: true,
    status: "ACTIVE",
    acceptsPrivate: true,
    churchApproved: true,
    churchActive: true,
    supportedLanguages: [],
    supportedCategories: [],
    geographicScope: null,
    churchCity: "San Jose",
    churchState: "CA",
    deliveryCount: 0,
    lastDeliveredAt: null,
    ...over,
  };
}

function prayer(over: Partial<PrayerRoutingRequest> = {}): PrayerRoutingRequest {
  return {
    visibility: "PRIVATE_PRAYER_TEAM",
    moderation_status: "CLEARLY_SAFE",
    language: "es",
    category: "FAMILY",
    city: "San Jose",
    target_church_id: null,
    ...over,
  };
}

function main() {
  assert.equal(MAX_PRAYER_TEAM_RECIPIENTS, 3);
  assert.equal(MAX_PRAYER_DELIVERY_ATTEMPTS, 3);

  const t1 = team({ teamId: "t1", churchId: "c1", deliveryCount: 5, lastDeliveredAt: "2026-08-01T00:00:00.000Z" });
  const t2 = team({ teamId: "t2", churchId: "c2", deliveryCount: 1, lastDeliveredAt: "2026-08-02T00:00:00.000Z" });
  const t3 = team({ teamId: "t3", churchId: "c3", deliveryCount: 1, lastDeliveredAt: "2026-07-01T00:00:00.000Z" });
  const t4 = team({ teamId: "t4", churchId: "c4", deliveryCount: 0 });

  const publicPrayer = prayer({ visibility: "PUBLIC_ANONYMOUS" });
  assert.equal(isPrayerNetworkRoutable(publicPrayer), false);
  assert.equal(selectPrayerNetworkTeams(publicPrayer, [t1, t2, t3]).selected.length, 0);

  const three = selectPrayerNetworkTeams(prayer(), [t1, t2, t3, t4]);
  assert.equal(three.selected.length, 3);
  assert.ok(!three.selected.some((t) => t.teamId === "t1"));
  assert.equal(three.reason, "ROUTED");

  const one = selectPrayerNetworkTeams(prayer(), [t4]);
  assert.equal(one.selected.length, 1);
  assert.equal(one.selected[0].teamId, "t4");

  const zero = selectPrayerNetworkTeams(prayer(), []);
  assert.equal(zero.selected.length, 0);
  assert.equal(zero.reason, "NONE_ELIGIBLE");

  for (const status of ["PENDING", "HUMAN_REVIEW", "CRISIS_REVIEW", "DISALLOWED", "REMOVED"] as const) {
    const blocked = selectPrayerNetworkTeams(prayer({ moderation_status: status }), [t1, t2, t3]);
    assert.equal(blocked.selected.length, 0, status);
    assert.equal(blocked.reason, "NOT_ROUTABLE");
  }

  const paused = selectPrayerNetworkTeams(prayer(), [team({ ...t4, teamId: "paused", churchId: "cp", status: "PAUSED" })]);
  assert.equal(paused.selected.length, 0);
  const disabled = selectPrayerNetworkTeams(prayer(), [team({ ...t4, teamId: "dis", churchId: "cd", status: "DISABLED" })]);
  assert.equal(disabled.selected.length, 0);
  const inactive = selectPrayerNetworkTeams(prayer(), [team({ ...t4, teamId: "inact", churchId: "ci", churchActive: false })]);
  assert.equal(inactive.selected.length, 0);
  const unapproved = selectPrayerNetworkTeams(prayer(), [team({ ...t4, teamId: "unap", churchId: "cu", churchApproved: false })]);
  assert.equal(unapproved.selected.length, 0);

  const langMismatch = selectPrayerNetworkTeams(
    prayer({ language: "es" }),
    [team({ ...t4, teamId: "enonly", churchId: "ce", supportedLanguages: ["en"] })],
  );
  assert.equal(langMismatch.selected.length, 0);
  const langOk = selectPrayerNetworkTeams(
    prayer({ language: "es" }),
    [team({ ...t4, teamId: "biling", churchId: "cb", supportedLanguages: ["bilingual"] })],
  );
  assert.equal(langOk.selected.length, 1);

  const catMismatch = selectPrayerNetworkTeams(
    prayer({ category: "HEALTH" }),
    [team({ ...t4, teamId: "fam", churchId: "cf", supportedCategories: ["FAMILY"] })],
  );
  assert.equal(catMismatch.selected.length, 0);
  const catOk = selectPrayerNetworkTeams(
    prayer({ category: "HEALTH" }),
    [team({ ...t4, teamId: "health", churchId: "ch", supportedCategories: ["HEALTH"] })],
  );
  assert.equal(catOk.selected.length, 1);

  const first = selectPrayerNetworkTeams(prayer(), [t4, t3, t2]);
  const second = selectPrayerNetworkTeams(prayer(), [t4, t3, t2]);
  assert.deepEqual(
    first.selected.map((t) => t.teamId),
    second.selected.map((t) => t.teamId),
  );

  const noConsent = mapPrayerTeamDeliveryPayload({
    body: "Please pray for my family this week at home.",
    category: "FAMILY",
    language: "es",
    display_name: "Maria",
    city: "San Jose",
    contact_consent: false,
    preferred_contact_method: "email",
    contact_email: "hidden@example.com",
    contact_phone: "555-0100",
    contact_whatsapp: "555-0100",
    submitter_user_id: "user-uuid",
    anonymous_session_hash: "hash",
    ip_hash: "ip",
    ai_decision: "CLEARLY_SAFE",
  });
  assert.equal(noConsent.contact, null);
  assert.equal(noConsent.displayName, null);
  assert.equal(noConsent.city, null);
  const noConsentJson = JSON.stringify(noConsent);
  assert.ok(!noConsentJson.includes("hidden@example.com"));
  assert.ok(!noConsentJson.includes("555-0100"));
  assert.ok(!noConsentJson.includes("user-uuid"));
  assert.equal(prayerDeliveryPayloadHasForbiddenKeys(noConsent).length, 0);

  const withConsent = mapPrayerTeamDeliveryPayload({
    body: "Please pray for my family this week at home.",
    category: "FAMILY",
    language: "es",
    display_name: "Maria",
    city: "San Jose",
    contact_consent: true,
    preferred_contact_method: "email",
    contact_email: "ok@example.com",
    contact_phone: null,
    contact_whatsapp: null,
  });
  assert.equal(withConsent.displayName, "Maria");
  assert.equal(withConsent.contact?.value, "ok@example.com");

  const targetOk = selectPrayerNetworkTeams(prayer({ target_church_id: "c2" }), [t1, t2, t3, t4]);
  assert.equal(targetOk.selected.length, 1);
  assert.equal(targetOk.selected[0].churchId, "c2");
  assert.equal(targetOk.reason, "TARGET_ROUTED");

  const targetBad = selectPrayerNetworkTeams(
    prayer({ target_church_id: "c-paused" }),
    [t1, team({ teamId: "tp", churchId: "c-paused", status: "PAUSED" })],
  );
  assert.equal(targetBad.selected.length, 0);
  assert.equal(targetBad.reason, "TARGET_INELIGIBLE");

  const paidA = selectPrayerNetworkTeams(prayer(), [t1, t2, t3], { featured: true, stripeCustomer: "cus_x", package: "gold" });
  const paidB = selectPrayerNetworkTeams(prayer(), [t1, t2, t3]);
  assert.deepEqual(
    paidA.selected.map((t) => t.teamId),
    paidB.selected.map((t) => t.teamId),
  );

  assert.equal(canRetryPrayerDelivery(0), true);
  assert.equal(canRetryPrayerDelivery(2), true);
  assert.equal(canRetryPrayerDelivery(3), false);

  assert.equal(prayerNetworkEmailSubject("es"), "Nueva petición privada de oración — Leonix");
  assert.equal(prayerNetworkEmailSubject("en"), "New private prayer request — Leonix");

  assert.equal(
    isPublicPrayerNetworkParticipant({
      churchApproved: true,
      churchActive: true,
      published: true,
      teamEnabled: true,
      teamStatus: "ACTIVE",
      acceptsPrivate: true,
    }),
    true,
  );
  assert.equal(
    isPublicPrayerNetworkParticipant({
      churchApproved: true,
      churchActive: true,
      published: true,
      teamEnabled: true,
      teamStatus: "ACTIVE",
      acceptsPrivate: false,
    }),
    false,
  );

  const es = getPrayerUiCopy("es");
  const en = getPrayerUiCopy("en");
  assert.ok(es.outcomePrivateRouted(2).includes("2"));
  assert.ok(en.outcomePrivateRouted(2).includes("2"));
  assert.ok(es.outcomePrivateZero.includes("Aún no hay"));
  assert.ok(en.outcomePrivateZero.toLowerCase().includes("not a team available"));
  assert.equal(es.badgePrayerNetwork, "Participa en la Red de Oración Leonix");
  assert.equal(en.badgePrayerNetwork, "Participates in the Leonix Prayer Network");
  const applyEs = getIglesiasCopy("es");
  const applyEn = getIglesiasCopy("en");
  assert.ok(applyEs.applyPrayerTeamLegend.includes("equipo o ministerio de oración"));
  assert.ok(applyEn.applyPrayerTeamLegend.includes("prayer team or prayer ministry"));

  const migration = src("supabase/migrations/20260819203513_iglesias_prayer_network.sql");
  assert.ok(migration.includes("church_prayer_teams"));
  assert.ok(migration.includes("church_prayer_team_members"));
  assert.ok(migration.includes("prayer_team_deliveries"));
  assert.ok(migration.includes("enable row level security"));
  assert.ok(migration.includes("revoke all on table public.church_prayer_team_members"));
  assert.ok(migration.includes("revoke all on table public.prayer_team_deliveries"));
  assert.ok(migration.includes("prayer_team_deliveries_unique_uidx"));
  assert.ok(migration.includes("prayer_team_intent"));
  assert.ok(!migration.includes("verification_status = 'verified'"));

  const routingSrc = src("app/lib/iglesias/prayerNetworkRouting.ts");
  const orchSrc = src("app/lib/iglesias/prayerNetworkOrchestrate.ts");
  for (const banned of [
    "listing_package_entitlements",
    "leonix_placement_entitlements",
    "leonix_payment_records",
    "leonix_promo_codes",
    "stripe",
    "Stripe",
  ]) {
    assert.ok(!routingSrc.includes(banned), `routing ${banned}`);
    assert.ok(!orchSrc.includes(banned), `orchestrate ${banned}`);
  }
  assert.ok(orchSrc.includes("ignoreDuplicates"));
  assert.ok(orchSrc.includes("canRetryPrayerDelivery"));
  assert.ok(src("app/lib/iglesias/churchApplication.ts").includes("prayer_network_enrolled: false"));
  assert.ok(src("app/(site)/iglesias/components/IglesiasPrayerLane.tsx").includes("networkJoin"));
  assert.ok(!src("app/(site)/iglesias/components/IglesiasPrayerLane.tsx").includes("IglesiasComingSoonBadge"));

  console.log("PASS");
}

main();
