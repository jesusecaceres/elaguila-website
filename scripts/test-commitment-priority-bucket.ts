/**
 * Gate 6 — real runtime unit tests for commitmentPriorityBucket (pure, no I/O).
 * Run from repo root: npx tsx scripts/test-commitment-priority-bucket.ts
 */
import { strict as assert } from "node:assert";
import {
  commitmentPriorityBucket,
  COMMITMENT_PRIORITY_ORDER,
} from "../app/admin/(dashboard)/businesses/[businessId]/commitmentPriority";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Gate 6 — Commitment priority bucketing — real runtime tests\n");

const NOW = new Date("2026-09-10T12:00:00Z").getTime();
const past = (hoursAgo: number) => new Date(NOW - hoursAgo * 3600_000).toISOString();
const future = (hoursAhead: number) => new Date(NOW + hoursAhead * 3600_000).toISOString();

check("completed status is always history, even with a past due date", () => {
  assert.equal(commitmentPriorityBucket({ status: "completed", dueAt: past(48) }, NOW), "history");
});
check("released status is always history", () => {
  assert.equal(commitmentPriorityBucket({ status: "released", dueAt: null }, NOW), "history");
});
check("active with a past due date is overdue", () => {
  assert.equal(commitmentPriorityBucket({ status: "active", dueAt: past(1) }, NOW), "overdue");
});
check("blocked with a past due date is still overdue — overdue outranks blocked", () => {
  assert.equal(commitmentPriorityBucket({ status: "blocked", dueAt: past(1) }, NOW), "overdue");
});
check("blocked with no due date or a future due date is blocked", () => {
  assert.equal(commitmentPriorityBucket({ status: "blocked", dueAt: null }, NOW), "blocked");
  assert.equal(commitmentPriorityBucket({ status: "blocked", dueAt: future(48) }, NOW), "blocked");
});
check("active due within the 3-day window is due_soon", () => {
  assert.equal(commitmentPriorityBucket({ status: "active", dueAt: future(2) }, NOW), "due_soon");
});
check("planned due exactly at the 3-day boundary is due_soon (inclusive)", () => {
  assert.equal(commitmentPriorityBucket({ status: "planned", dueAt: future(72) }, NOW), "due_soon");
});
check("active due well beyond the window is open", () => {
  assert.equal(commitmentPriorityBucket({ status: "active", dueAt: future(240) }, NOW), "open");
});
check("planned with no due date at all is open", () => {
  assert.equal(commitmentPriorityBucket({ status: "planned", dueAt: null }, NOW), "open");
});
check("priority order matches the mandated visual sequence: overdue, blocked, due_soon, open, history", () => {
  assert.deepEqual(COMMITMENT_PRIORITY_ORDER, ["overdue", "blocked", "due_soon", "open", "history"]);
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
