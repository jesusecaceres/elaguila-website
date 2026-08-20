import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const CANDIDATES_PATH = "data/recursos/candidates/scc-community-resource-guide-2023.json";
const FINAL_PATH = "data/recursos/verified/scc-community-resource-guide-2023-final-research.json";
const READY_PATH = "data/recursos/verified/scc-community-resource-guide-2023-ready-for-import.json";
const NEEDS_REVIEW_PATH = "data/recursos/verified/scc-community-resource-guide-2023-needs-review.json";
const DROPPED_PATH = "data/recursos/verified/scc-community-resource-guide-2023-dropped.json";

assert("immutable candidate JSON exists", exists(CANDIDATES_PATH));
assert("final research manifest exists", exists(FINAL_PATH));
assert("ready-for-import view exists", exists(READY_PATH));
assert("needs-review view exists", exists(NEEDS_REVIEW_PATH));
assert("dropped view exists", exists(DROPPED_PATH));

let candidates = null;
try {
  candidates = JSON.parse(read(CANDIDATES_PATH));
  assert("immutable candidate JSON parses", Array.isArray(candidates));
} catch (err) {
  assert("immutable candidate JSON parses", false, String(err));
}

let final = null;
try {
  final = JSON.parse(read(FINAL_PATH));
  assert("final research manifest JSON parses", true);
} catch (err) {
  assert("final research manifest JSON parses", false, String(err));
}

let readyView = null;
let needsReviewView = null;
let droppedView = null;
try {
  readyView = JSON.parse(read(READY_PATH));
  assert("ready-for-import JSON parses", Array.isArray(readyView));
} catch (err) {
  assert("ready-for-import JSON parses", false, String(err));
}
try {
  needsReviewView = JSON.parse(read(NEEDS_REVIEW_PATH));
  assert("needs-review JSON parses", Array.isArray(needsReviewView));
} catch (err) {
  assert("needs-review JSON parses", false, String(err));
}
try {
  droppedView = JSON.parse(read(DROPPED_PATH));
  assert("dropped JSON parses", Array.isArray(droppedView));
} catch (err) {
  assert("dropped JSON parses", false, String(err));
}

if (candidates && final) {
  const records = Array.isArray(final.records) ? final.records : [];

  // ---- Totals ----
  assert("candidate JSON has 175 records", candidates.length === 175, candidates.length);
  assert("final manifest totalCandidates === 175", final.totalCandidates === 175, final.totalCandidates);
  assert("final manifest records.length === 175", records.length === 175, records.length);
  assert("summary.ready === 65", final.summary?.ready === 65, final.summary?.ready);
  assert("summary.needsReview === 77", final.summary?.needsReview === 77, final.summary?.needsReview);
  assert("summary.dropped === 33", final.summary?.dropped === 33, final.summary?.dropped);
  assert(
    "summary counts sum to 175",
    (final.summary?.ready ?? 0) + (final.summary?.needsReview ?? 0) + (final.summary?.dropped ?? 0) === 175
  );
  assert("researchCompletedAt is present (ISO timestamp)", typeof final.researchCompletedAt === "string" && !Number.isNaN(Date.parse(final.researchCompletedAt)), final.researchCompletedAt);

  // ---- Per-priority breakdowns ----
  const EXPECTED_PRIORITIES = {
    1: { total: 39, ready: 10, needsReview: 6, dropped: 23 },
    2: { total: 56, ready: 23, needsReview: 30, dropped: 3 },
    3: { total: 80, ready: 32, needsReview: 41, dropped: 7 },
  };
  for (const p of [1, 2, 3]) {
    const declared = final.priorities?.[String(p)] ?? final.priorities?.[p];
    const exp = EXPECTED_PRIORITIES[p];
    assert(
      `priorities[${p}] matches expected breakdown (${JSON.stringify(exp)})`,
      declared &&
        declared.total === exp.total &&
        declared.ready === exp.ready &&
        declared.needsReview === exp.needsReview &&
        declared.dropped === exp.dropped,
      declared
    );

    const actual = records.filter((r) => r.verificationPriority === p);
    assert(
      `records actually contain ${exp.total} priority-${p} entries`,
      actual.length === exp.total,
      actual.length
    );
    assert(
      `priority-${p} actual ready/needsReview/dropped counts match (${JSON.stringify(exp)})`,
      actual.filter((r) => r.researchDisposition === "READY_FOR_COACH_INSERT").length === exp.ready &&
        actual.filter((r) => r.researchDisposition === "NEEDS_REVIEW").length === exp.needsReview &&
        actual.filter((r) => r.researchDisposition === "DROPPED").length === exp.dropped
    );
  }

  // ---- candidateId completeness / uniqueness vs immutable source ----
  const sourceIds = new Set(candidates.map((c) => c.candidateId));
  const manifestIds = records.map((r) => r.candidateId);
  const manifestIdSet = new Set(manifestIds);

  assert("no duplicate candidateIds in final manifest", manifestIds.length === manifestIdSet.size, manifestIds.length - manifestIdSet.size);

  const missingFromManifest = [...sourceIds].filter((id) => !manifestIdSet.has(id));
  assert("every immutable candidateId appears in the final manifest", missingFromManifest.length === 0, missingFromManifest);

  const unknownInManifest = [...manifestIdSet].filter((id) => !sourceIds.has(id));
  assert("no unknown candidateIds in the final manifest", unknownInManifest.length === 0, unknownInManifest);

  // ---- View file counts ----
  assert("ready-for-import view has exactly 65 records", readyView?.length === 65, readyView?.length);
  assert("needs-review view has exactly 77 records", needsReviewView?.length === 77, needsReviewView?.length);
  assert("dropped view has exactly 33 records", droppedView?.length === 33, droppedView?.length);

  // ready-for-import must be sorted by verificationPriority asc, then candidateId asc
  if (readyView) {
    let sorted = true;
    for (let i = 1; i < readyView.length; i++) {
      const prev = readyView[i - 1];
      const cur = readyView[i];
      if (
        prev.verificationPriority > cur.verificationPriority ||
        (prev.verificationPriority === cur.verificationPriority && prev.candidateId > cur.candidateId)
      ) {
        sorted = false;
        break;
      }
    }
    assert("ready-for-import view is sorted by verificationPriority asc, then candidateId asc", sorted);
  }

  // ---- Immutable candidate JSON untouched (spot structural check) ----
  assert("immutable candidate JSON unaffected — still 175 records with needs_review/null verification state", candidates.every((c) => c.verificationStatus === "needs_review" && c.verifiedAt === null));

  // ---- READY completeness rules ----
  const readyRecords = records.filter((r) => r.researchDisposition === "READY_FOR_COACH_INSERT");
  assert("every READY has manifestCompleteness = complete", readyRecords.every((r) => r.manifestCompleteness === "complete"));
  assert("every READY has a currentSourceUrl", readyRecords.every((r) => typeof r.currentSourceUrl === "string" && r.currentSourceUrl.length > 0));
  assert("every READY has organizationConfirmedActive === true", readyRecords.every((r) => r.organizationConfirmedActive === true));
  assert("every READY has a suggestedResourceCorrections object", readyRecords.every((r) => r.suggestedResourceCorrections && typeof r.suggestedResourceCorrections === "object"));

  const hasUsableContact = (r) => {
    const f = r.currentFacts || {};
    const c = r.suggestedResourceCorrections || {};
    return Boolean(f.phone || f.crisisPhone || f.sms || f.websiteUrl || f.applicationUrl || c.phone || c.crisisPhone || c.sms || c.websiteUrl || c.applicationUrl);
  };
  const noContactReady = readyRecords.filter((r) => !hasUsableContact(r));
  assert("every READY has at least one usable contact method (phone/crisisPhone/sms/websiteUrl/applicationUrl)", noContactReady.length === 0, noContactReady.map((r) => r.candidateId));

  const badIs24 = readyRecords.filter((r) => {
    const is24 = r.currentFacts?.is24Hours === true || r.suggestedResourceCorrections?.is24Hours === true;
    if (!is24) return false;
    const notes = (r.verificationNotes || "").toLowerCase();
    const hours = (r.currentFacts?.hours || r.suggestedResourceCorrections?.hoursNoteEn || "").toLowerCase();
    const has24Evidence = /24\/7|24-hour|24 hours|round.the.clock/.test(notes) || /24\/7|24-hour|24 hours/.test(hours);
    return !has24Evidence;
  });
  assert("every READY claiming is24Hours=true has explicit 24/7 evidence in notes or hours", badIs24.length === 0, badIs24.map((r) => r.candidateId));

  // ---- DROPPED / NEEDS_REVIEW reason completeness ----
  const droppedRecords = records.filter((r) => r.researchDisposition === "DROPPED");
  assert("every DROPPED has a non-empty dropReason", droppedRecords.every((r) => typeof r.dropReason === "string" && r.dropReason.trim().length > 0));

  const needsReviewRecords = records.filter((r) => r.researchDisposition === "NEEDS_REVIEW");
  assert(
    "every NEEDS_REVIEW has a non-empty whyBlocked or missingProof",
    needsReviewRecords.every(
      (r) =>
        (typeof r.needsReview?.whyBlocked === "string" && r.needsReview.whyBlocked.trim().length > 0) ||
        (typeof r.needsReview?.missingProof === "string" && r.needsReview.missingProof.trim().length > 0)
    )
  );

  // ---- Specific locked facts ----
  const serialized = JSON.stringify(readyRecords);
  assert("no READY record contains the stale 800-436-9997 number", !serialized.includes("800-436-9997"));

  const nextDoor = readyRecords.find((r) => r.candidateId === "next-door-solutions");
  assert(
    "Next Door Solutions READY record uses https://www.nextdoorsolutions.org/",
    Boolean(nextDoor) &&
      (nextDoor.currentSourceUrl === "https://www.nextdoorsolutions.org/" ||
        nextDoor.currentFacts?.websiteUrl === "https://www.nextdoorsolutions.org/" ||
        nextDoor.suggestedResourceCorrections?.websiteUrl === "https://www.nextdoorsolutions.org/"),
    nextDoor
  );

  const crisisTextLine = readyRecords.find((r) => /crisis text line/i.test(r.organizationName || ""));
  if (crisisTextLine) {
    const currentSms = crisisTextLine.currentFacts?.sms || "";
    const correctedSms = crisisTextLine.suggestedResourceCorrections?.sms || "";
    const blob = JSON.stringify(crisisTextLine);
    assert("Crisis Text Line READY record includes 741741", blob.includes("741741"));
    assert("Crisis Text Line READY record includes HOME", /\bHOME\b/.test(currentSms) && /\bHOME\b/.test(correctedSms));
    assert(
      "Crisis Text Line READY record does not promote BAY as the current instruction (currentFacts/suggestedResourceCorrections sms)",
      !/\bBAY\b/i.test(currentSms) && !/\bBAY\b/i.test(correctedSms)
    );
  } else {
    assert("Crisis Text Line READY record exists", false, "no organizationName matched /crisis text line/i among READY records");
  }
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
