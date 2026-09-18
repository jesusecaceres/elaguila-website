/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 2 (Admin payment-state safety, 2026-09-18).
 *
 * The live defect: the legacy free-text status <select> in ServiciosAdminOpsListingCard.tsx had no
 * `pending_payment` option, so its defaultValue silently fell back to displaying (and, on submit,
 * writing) "pending_review" whenever an operator saved something as unrelated as moderation notes
 * on a pending_payment row — a live path to publish an unpaid listing.
 *
 * Fix: (1) a pure guard, serviciosStatusFormAllowsMutation, unit-tested directly without any DB;
 * (2) the legacy status-form server action now refuses to touch listing_status when the row's real
 * current status is pending_payment, regardless of what was submitted (belt-and-suspenders); (3) a
 * new notes-only action that never touches listing_status at all; (4) the card no longer even
 * renders the mutable status control for a pending_payment row — only a truthful read-only notice
 * plus the notes-only form. The already-correct, Restaurantes-style named-action route
 * (PATCH /api/admin/servicios/listings/[id]) is untouched — it was never the source of the bug.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate2-admin-payment-safety.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { serviciosStatusFormAllowsMutation } from "../app/(site)/clasificados/servicios/lib/serviciosListingLifecycle";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const ACTIONS = "app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts";
const CARD = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx";
const NAMED_ROUTE = "app/api/admin/servicios/listings/[id]/route.ts";

/* ── Pure guard, unit-tested directly (the property this whole gate depends on) ── */
check("REGRESSION: a pending_payment row never allows the legacy status form to mutate it", () => {
  assert.equal(serviciosStatusFormAllowsMutation("pending_payment"), false);
  assert.equal(serviciosStatusFormAllowsMutation("PENDING_PAYMENT"), false, "case-insensitive");
  assert.equal(serviciosStatusFormAllowsMutation("  pending_payment  "), false, "whitespace-insensitive");
});
check("every other real lifecycle status is unaffected by the guard", () => {
  for (const s of ["published", "pending_review", "paused_unpublished", "rejected", "suspended", "draft", null, undefined]) {
    assert.equal(serviciosStatusFormAllowsMutation(s), true, `${String(s)} must remain mutable via the legacy form`);
  }
});

/* ── Server-side twin: the action itself must consult the guard before writing status ── */
check("updateServiciosPublicListingStatusAction reads the row's CURRENT status before any write, and consults the guard", () => {
  const src = raw(ACTIONS);
  const fnStart = src.indexOf("export async function updateServiciosPublicListingStatusAction(");
  assert.ok(fnStart > 0);
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes('.select("slug, listing_status")'), "must read the row's real current status");
  assert.ok(
    body.includes("if (!serviciosStatusFormAllowsMutation("),
    "must gate the write on the pure guard",
  );
  // The guarded early-return branch must write notes only — never listing_status.
  const guardIdx = body.indexOf("if (!serviciosStatusFormAllowsMutation(");
  const guardBlockEnd = body.indexOf("return;", guardIdx);
  const guardBlock = body.slice(guardIdx, guardBlockEnd);
  assert.ok(!guardBlock.includes("listing_status: status"), "the pending_payment branch must never write listing_status");
  assert.ok(guardBlock.includes("moderation_notes"), "the pending_payment branch must still allow notes to save");
});

check("a dedicated notes-only action exists and never references listing_status at all", () => {
  const src = raw(ACTIONS);
  const fnStart = src.indexOf("export async function updateServiciosModerationNotesAction(");
  assert.ok(fnStart > 0);
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(!body.includes("listing_status"), "notes-only action must be structurally incapable of touching status");
});

/* ── Client: no mutable status control is even rendered for a pending_payment row ── */
check("the admin card renders a truthful read-only notice (not a mutable select) for pending_payment, with a notes-only form", () => {
  const src = raw(CARD);
  assert.ok(src.includes('row.listing_status === "pending_payment"'), "card must branch on the real current status");
  const branchIdx = src.indexOf('row.listing_status === "pending_payment"');
  const elseIdx = src.indexOf(") : (", branchIdx);
  const pendingBranch = src.slice(branchIdx, elseIdx);
  assert.ok(!pendingBranch.includes('name="listing_status"'), "no mutable status select in the pending_payment branch");
  assert.ok(pendingBranch.includes("updateServiciosModerationNotesAction"), "pending_payment branch uses the notes-only action");
  assert.ok(pendingBranch.includes("Pago pendiente"), "truthful notice must be present");
  const otherBranchEnd = src.indexOf("</div>", elseIdx);
  const otherBranch = src.slice(elseIdx, otherBranchEnd);
  assert.ok(otherBranch.includes('name="listing_status"'), "every other status keeps its existing mutable control, unchanged");
});

/* ── The already-correct named-action system (the real fix pattern) is untouched ── */
check("REGRESSION GUARD: the Restaurantes-style named-action route is untouched and still refuses free-text status", () => {
  const src = raw(NAMED_ROUTE);
  assert.ok(src.includes("type ServiciosStaffAction ="), "still a closed, named-action union");
  assert.ok(
    src.includes("const action = (body as { action?: unknown }).action;"),
    "the only field ever extracted from the client body is `action` — never a raw listing_status",
  );
  assert.ok(!/body\s+as\s*\{[^}]*listing_status/.test(src), "request body is never typed/read as carrying listing_status");
  for (const action of ["suspend", "unsuspend", "promote_on", "promote_off", "verify_on", "verify_off", "archive", "republish"]) {
    assert.ok(src.includes(`"${action}"`), `named action "${action}" still present`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate2-admin-payment-safety: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate2-admin-payment-safety: PASS");
