/**
 * ADMIN-BULK-FLAGGED-CLEANUP-01 verification.
 * Run: npm run verify:admin-bulk-flagged-cleanup
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];

function assert(name, condition, detail = "") {
  checks.push({ name, ok: Boolean(condition), detail });
}

const table = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const bulkBar = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueBulkBar.tsx";
const rowPanel = "app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx";
const actions = "app/admin/actions.ts";
const actionFlow = "app/admin/_lib/adminQueueActionFlow.ts";
const clasificadosPage = "app/admin/(dashboard)/workspace/clasificados/page.tsx";
const pkg = "package.json";

const tableSrc = read(table);
const bulkSrc = read(bulkBar);
const panelSrc = read(rowPanel);
const actionsSrc = read(actions);
const flowSrc = read(actionFlow);
const pageSrc = read(clasificadosPage);
const pkgSrc = read(pkg);

assert("bulk bar component exists", exists(bulkBar), bulkBar);
assert("row checkbox support in table", tableSrc.includes("selectedIds") && tableSrc.includes("toggleRowSelected"), table);
assert("desktop row checkbox", tableSrc.includes('data-testid="clasificados-row-checkbox"'), table);
assert("mobile card checkbox", tableSrc.includes('data-testid="clasificados-mobile-row-checkbox"'), table);
assert("select all visible control", tableSrc.includes('data-testid="clasificados-select-all-visible"'), table);
assert("selected count", bulkSrc.includes("selected") && tableSrc.includes("selectedCount"), table);
assert("clear selection", bulkSrc.includes("Clear selection") && tableSrc.includes("clearSelection"), table);
assert("bulk action bar", bulkSrc.includes('data-testid="clasificados-bulk-action-bar"'), bulkBar);
assert("bulk soft delete selected", bulkSrc.includes("Delete / remove selected") && actionsSrc.includes("bulkSoftDeleteListingsAction"), bulkBar);
assert(
  "soft delete not permanent copy",
  bulkSrc.includes("Not permanent") && bulkSrc.includes("removed"),
  bulkBar,
);
assert(
  "permanent delete selected protected",
  bulkSrc.includes("Permanent delete selected") && actionsSrc.includes("permanentlyDeleteListingsAction"),
  bulkBar,
);
assert(
  "permanent delete typed confirmation",
  tableSrc.includes("PERMANENTLY DELETE") && bulkSrc.includes("cannot be undone"),
  table,
);
assert(
  "bulk actions preserve queue anchor",
  tableSrc.includes('hash_anchor: "queue"') && flowSrc.includes('hash_anchor?: "queue"'),
  table,
);
assert(
  "action proof preserved",
  tableSrc.includes("buildAdminActionReturnUrl") && flowSrc.includes("bulk_soft_delete"),
  table,
);
assert(
  "existing single-row actions preserved",
  panelSrc.includes("onDelete(row)") && panelSrc.includes("ClassifiedAdminRowActions") && tableSrc.includes("deleteListingAction"),
  rowPanel,
);
assert("mobile tappable buttons", bulkSrc.includes("min-h-[44px]"), bulkBar);
assert("no horizontal overflow mobile list", tableSrc.includes("overflow-x-hidden"), table);
assert("only visible rows selection reset", tableSrc.includes("visibleRowIdsKey"), table);
assert("bulk server uses listings table", actionsSrc.includes('.from("listings")') && actionsSrc.includes('status: "removed"'), actions);
assert("no public page changes", !tableSrc.includes("app/(site)/clasificados/page"), table);
assert("no schema migrations", !pageSrc.includes("supabase/migrations") && !actionsSrc.includes("CREATE TABLE"), clasificadosPage);
assert("no stripe changes", !bulkSrc.includes("stripe") && !actionsSrc.includes("stripe"), bulkBar);
assert("no category logic changes in bulk bar", !bulkSrc.includes("category-specific"), bulkBar);
assert("verify script registered", pkgSrc.includes("verify:admin-bulk-flagged-cleanup"), pkg);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error("verify:admin-bulk-flagged-cleanup FAIL\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-bulk-flagged-cleanup PASS (${checks.length} checks)`);
