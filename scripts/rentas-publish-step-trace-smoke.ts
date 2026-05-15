/**
 * Rentas Gate 08E — step trace + publish pipeline invariants (Node, no browser).
 */

import assert from "node:assert/strict";
import {
  prepareLeonixListingDescriptionForPublish,
  sanitizeLeonixListingPublishDescriptionBody,
  toLeonixListingsDescriptionForDb,
} from "../app/(site)/clasificados/lib/leonixPublishPublicDescription";
import {
  rentasPublishStepTracePatch,
  rentasPublishStepTraceReset,
  rentasPublishStepTraceSnapshot,
} from "../app/(site)/clasificados/rentas/lib/rentasPublishStepTrace";

function rentasDescriptionColumnPipeline(raw: string): string | null {
  return toLeonixListingsDescriptionForDb(sanitizeLeonixListingPublishDescriptionBody(raw));
}

const long = "x".repeat(5000);
const brStrict = prepareLeonixListingDescriptionForPublish(long, "es");
assert.equal(brStrict.ok, false);

const rentasCol = rentasDescriptionColumnPipeline(long);
assert.ok(rentasCol != null);
assert.ok(rentasCol.length <= 3900);

const snap0 = rentasPublishStepTraceReset();
assert.equal(snap0.publishClicked, false);

rentasPublishStepTracePatch({ publishClicked: true, errorClearedAtStart: true });
const snap1 = rentasPublishStepTraceSnapshot();
assert.equal(snap1.publishClicked, false, "patch is no-op in Node (diag off)");

console.log("rentas-publish-step-trace-smoke: OK");
