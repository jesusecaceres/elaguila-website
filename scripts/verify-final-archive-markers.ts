/**
 * FINAL CLOSEOUT - a STAFF archive is not owner-reversible (Comida Local + Empleos).
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-final-archive-markers.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

async function main() {
  const emp = await import("../app/admin/_lib/adminEmpleosStaffActions");
  const pol = await import("../app/(site)/clasificados/empleos/lib/empleosPublishLifecyclePolicy");
  const comida = await import("../app/lib/clasificados/comida-local/comidaLocalAdminModeration");

  await check("Empleos: staff archive writes a marker; the owner cannot reopen a staff-archived post; Restore clears the marker", () => {
    const row = { lifecycle_status: "published", lane: "quick", published_at: "2026-09-01T00:00:00Z" };
    const a = emp.decideEmpleosStaffAction({ action: "archive", row, now: "2026-09-19T00:00:00Z" });
    assert.ok(a.ok);
    if (a.ok) assert.equal(a.patch.moderation_reason, emp.EMPLEOS_STAFF_ARCHIVED_MARKER);
    const held = pol.resolveEmpleosOwnerTransition({ lane: "quick", current: "archived", next: "published", hasStaffReason: true, everPublished: true });
    assert.deepEqual(held, { ok: false, error: "staff_hold" });
    const ownerArchived = pol.resolveEmpleosOwnerTransition({ lane: "quick", current: "archived", next: "published", hasStaffReason: false, everPublished: true });
    assert.deepEqual(ownerArchived, { ok: true });
    const archivedRow = { lifecycle_status: "archived", lane: "quick", published_at: "2026-09-01T00:00:00Z", moderation_reason: "staff_archived" };
    const restore = emp.decideEmpleosStaffAction({ action: "unsuspend", row: archivedRow, now: "2026-09-19T00:00:00Z", paymentCleared: true });
    assert.ok(restore.ok);
    if (restore.ok) assert.equal(restore.patch.moderation_reason, null);
  });

  await check("Comida: staff archive writes suspended_reason; republish clears it; owner resume refuses a held row", () => {
    const d = comida.decideComidaLocalAdminAction("archive", { status: "published" } as never);
    assert.ok(d.ok);
    if (d.ok) assert.deepEqual(d.patch, { status: "paused", suspended_reason: comida.COMIDA_LOCAL_STAFF_ARCHIVE_REASON });
    const route = raw("app/api/clasificados/comida-local/lifecycle/route.ts");
    assert.match(route, /\.is\("suspended_reason", null\)/);
    assert.match(route, /error: "staff_hold"/);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}
void main();
