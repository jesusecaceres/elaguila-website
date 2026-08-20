/**
 * Iglesias BUILD 04 self-test — AI-first church intake + prayer acknowledgement UI.
 * Run: npx tsx scripts/iglesias-build-04-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { parseChurchApplication, type ChurchApplicationInput } from "../app/lib/iglesias/churchApplicationParse";
import { runChurchIntakeDeterministic } from "../app/lib/iglesias/churchIntakeDeterministic";
import { parseChurchIntakeAiJson, CHURCH_INTAKE_AI_SYSTEM_PROMPT } from "../app/lib/iglesias/churchIntakeAiAdapter";
import { finalizeChurchIntakeDecision } from "../app/lib/iglesias/churchIntakeDecide";
import { AUTO_PUBLISH_MIN_CONFIDENCE } from "../app/lib/iglesias/churchIntakeTypes";
import { mapPublicPrayer, isPubliclyListablePrayer, visibilityIsPrivate } from "../app/lib/iglesias/prayerPublicMapper";
import { getPrayerUiCopy } from "../app/lib/iglesias/prayerCopy";
import { getIglesiasCopy } from "../app/lib/iglesias/copy";
import { isPublicChurchEligible } from "../app/lib/iglesias/eligibility";

const ROOT = path.resolve(__dirname, "..");
function src(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function cleanApp(over: Partial<ChurchApplicationInput> = {}): ChurchApplicationInput {
  const parsed = parseChurchApplication({
    name: "Iglesia Vida Nueva",
    city: "San Jose",
    state: "CA",
    country: "United States",
    applicantEmail: "pastor@example.com",
    languages: ["es"],
    publicLocation: true,
    denomination: "Asambleas de Dios",
    mission: "Somos una congregación bilingüe en San José.",
    ...over,
  });
  assert.equal(parsed.ok, true);
  return (parsed as { ok: true; data: ChurchApplicationInput }).data;
}

function main() {
  const clean = cleanApp();
  const detClear = runChurchIntakeDeterministic(clean, []);
  assert.equal(detClear.decision, "AUTO_PUBLISH");

  const noWebsite = cleanApp({ website: undefined });
  assert.equal(runChurchIntakeDeterministic(noWebsite, []).decision, "AUTO_PUBLISH");
  const noLogo = cleanApp({ logoUrl: undefined });
  assert.equal(runChurchIntakeDeterministic(noLogo, []).decision, "AUTO_PUBLISH");
  const uncommon = cleanApp({ denomination: "Iglesia Independiente del Valle" });
  assert.equal(runChurchIntakeDeterministic(uncommon, []).decision, "AUTO_PUBLISH");
  const bilingual = cleanApp({ languages: ["es", "en"], mission: "Bilingual congregation serving families." });
  assert.equal(runChurchIntakeDeterministic(bilingual, []).decision, "AUTO_PUBLISH");

  const spam = cleanApp({ name: "Buy now casino bonus church", mission: "Click here to win crypto pump" });
  assert.equal(runChurchIntakeDeterministic(spam, []).decision, "BLOCK");

  const dup = runChurchIntakeDeterministic(clean, [
    {
      id: "other",
      name: "Iglesia Vida Nueva",
      city: "San Jose",
      state: "CA",
      country: "United States",
      zip: null,
      approval_status: "approved",
    },
  ]);
  assert.equal(dup.decision, "HUMAN_REVIEW");
  assert.ok(dup.reasons.includes("DUPLICATE_IDENTITY"));

  const thin = cleanApp({ city: undefined, state: undefined });
  assert.equal(runChurchIntakeDeterministic(thin, []).decision, "HUMAN_REVIEW");

  const aiPublish = parseChurchIntakeAiJson(
    JSON.stringify({
      decision: "AUTO_PUBLISH",
      confidence: 0.94,
      reasons: ["PLAUSIBLE_CONGREGATION"],
      riskSignals: [],
      identityConfidence: 0.9,
      safetyConfidence: 0.93,
    }),
  );
  assert.ok(aiPublish);
  const auto = finalizeChurchIntakeDecision(detClear, aiPublish, false);
  assert.equal(auto.decision, "AUTO_PUBLISH");
  assert.ok(auto.confidence >= AUTO_PUBLISH_MIN_CONFIDENCE);

  const uncertain = parseChurchIntakeAiJson(
    JSON.stringify({
      decision: "AUTO_PUBLISH",
      confidence: 0.51,
      reasons: ["LOW"],
      riskSignals: [],
      identityConfidence: 0.5,
      safetyConfidence: 0.5,
    }),
  );
  assert.equal(finalizeChurchIntakeDecision(detClear, uncertain, false).decision, "HUMAN_REVIEW");
  assert.equal(finalizeChurchIntakeDecision(detClear, null, true).decision, "HUMAN_REVIEW");
  assert.ok(finalizeChurchIntakeDecision(detClear, null, true).reasons.includes("AI_SCREENING_UNAVAILABLE"));

  const aiBlock = parseChurchIntakeAiJson(
    JSON.stringify({
      decision: "BLOCK",
      confidence: 0.96,
      reasons: ["MALICIOUS_LINK"],
      riskSignals: ["SCAM"],
      identityConfidence: 0.2,
      safetyConfidence: 0.96,
    }),
  );
  assert.equal(finalizeChurchIntakeDecision(detClear, aiBlock, false).decision, "BLOCK");

  assert.ok(CHURCH_INTAKE_AI_SYSTEM_PROMPT.includes("NOT a pastor"));
  assert.ok(CHURCH_INTAKE_AI_SYSTEM_PROMPT.includes("Do NOT judge theology"));
  assert.ok(CHURCH_INTAKE_AI_SYSTEM_PROMPT.includes("Listed is not verified"));

  const approval = src("app/lib/iglesias/churchApproval.ts");
  const submit = src("app/lib/iglesias/churchApplication.ts");
  const adminActions = src("app/admin/iglesiasChurchActions.ts");
  assert.ok(approval.includes("approval_status: \"approved\""));
  assert.ok(approval.includes("is_active: true"));
  assert.ok(approval.includes("published_at"));
  assert.ok(submit.includes("approveAndPublishChurch"));
  assert.ok(adminActions.includes("approveAndPublishChurch"));
  assert.ok(submit.includes("decideChurchIntake"));
  assert.ok(!submit.includes("verification_status: \"verified\""));

  assert.equal(
    isPublicChurchEligible({ approval_status: "approved", is_active: true, published_at: "2026-01-01" }),
    true,
  );

  const es = getIglesiasCopy("es");
  const en = getIglesiasCopy("en");
  assert.equal(es.applySuccessPublishedBody, "Tu iglesia fue recibida y publicada correctamente.");
  assert.equal(en.applySuccessPublishedBody, "Your church was received and published successfully.");
  assert.equal(es.applySuccessReviewBody, "Recibimos tu solicitud. Necesitamos revisar algunos detalles antes de publicarla.");
  assert.equal(en.applySuccessReviewBody, "We received your application. We need to review a few details before publishing it.");

  const queue = src("app/admin/(dashboard)/workspace/iglesias/page.tsx");
  assert.ok(queue.includes("AUTO-PUBLISHED"));
  assert.ok(queue.includes("NEEDS REVIEW"));
  assert.ok(queue.includes("BLOCKED"));
  assert.ok(queue.includes("Exception queue"));

  const prayerEs = getPrayerUiCopy("es");
  const prayerEn = getPrayerUiCopy("en");
  assert.equal(prayerEs.imPraying, "Estoy orando");
  assert.equal(prayerEn.imPraying, "I’m praying");

  const card = src("app/(site)/iglesias/components/IglesiasPrayerCard.tsx");
  assert.ok(card.includes("🙏"));
  assert.ok(card.includes("imPraying"));
  assert.ok(!card.includes("count > 0"));
  assert.ok(!/trending|leaderboard|most prayed|paid boost/i.test(card));
  assert.ok(!card.includes("heart"));

  const publicRow = {
    id: "p1",
    visibility: "PUBLIC_ANONYMOUS" as const,
    language: "es" as const,
    city: null,
    category: null,
    display_name: null,
    body: "Oren por mi familia.",
    status: "OPEN" as const,
    created_at: "2026-01-01T00:00:00.000Z",
    moderation_status: "CLEARLY_SAFE" as const,
    published_at: "2026-01-01T00:00:00.000Z",
  };
  const mapped0 = mapPublicPrayer({
    row: publicRow,
    acknowledgementCount: 0,
    latestUpdate: null,
    owned: false,
    acknowledgedByViewer: false,
  });
  assert.ok(mapped0);
  assert.equal(mapped0?.acknowledgementCount, 0);

  assert.equal(
    isPubliclyListablePrayer({
      visibility: "PRIVATE_PRAYER_TEAM",
      moderation_status: "CLEARLY_SAFE",
      status: "OPEN",
      published_at: "2026-01-01",
    }),
    false,
  );
  assert.equal(visibilityIsPrivate("PRIVATE_PRAYER_TEAM"), true);
  assert.equal(
    mapPublicPrayer({
      row: { ...publicRow, visibility: "PRIVATE_PRAYER_TEAM" },
      acknowledgementCount: 4,
      latestUpdate: null,
      owned: false,
      acknowledgedByViewer: false,
    }),
    null,
  );
  assert.equal(
    mapPublicPrayer({
      row: { ...publicRow, moderation_status: "HUMAN_REVIEW" },
      acknowledgementCount: 2,
      latestUpdate: null,
      owned: false,
      acknowledgedByViewer: false,
    }),
    null,
  );

  const ackApi = src("app/api/iglesias/prayers/[id]/acknowledge/route.ts");
  const service = src("app/lib/iglesias/prayerService.ts");
  assert.ok(ackApi.includes("acknowledgePrayer"));
  assert.ok(service.includes("duplicate|unique"));
  assert.ok(service.includes("prayer_acknowledgements"));
  assert.ok(!service.includes("trending"));

  const migration = src("supabase/migrations/20260820045236_iglesias_church_intake.sql");
  assert.ok(migration.includes("intake_decision"));
  assert.ok(migration.includes("revoke all on table public.church_submissions"));
  assert.ok(!migration.includes("grant select on table public.church_submissions"));

  assert.ok(existsSync(path.join(ROOT, "app/lib/iglesias/churchIntakeDecide.ts")));
  assert.ok(src("app/lib/iglesias/churchIntakeAiAdapter.ts").includes("ai-gateway.vercel.sh"));
  assert.ok(!src("app/(site)/iglesias/components/IglesiasPrayerLane.tsx").match(/sort by (ack|prayer count)/i));

  console.log("iglesias-build-04-selftest: PASS");
}

main();
