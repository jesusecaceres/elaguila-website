/**
 * Static guard (Gate A2): AdminListingsTable must place the Actions column
 * BEFORE the wide Leonix / En venta columns so row controls stay discoverable.
 * Run: node scripts/verify-admin-listings-actions-column.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const file = path.join(
  root,
  "app",
  "admin",
  "(dashboard)",
  "workspace",
  "clasificados",
  "AdminListingsTable.tsx",
);

const s = fs.readFileSync(file, "utf8");
const theadStart = s.indexOf("<thead>");
const theadEnd = s.indexOf("</thead>", theadStart);
if (theadStart === -1 || theadEnd === -1) {
  console.error("verify-admin-listings-actions-column: missing <thead>");
  process.exit(1);
}
const thead = s.slice(theadStart, theadEnd);
const ixActions = thead.indexOf('"listings.col.actions"');
const ixLeonix = thead.indexOf('"listings.col.leonix"');
const ixEnv = thead.indexOf('"listings.col.envVis"');
if (ixActions === -1 || ixLeonix === -1 || ixEnv === -1) {
  console.error(
    "verify-admin-listings-actions-column: missing expected column translation keys in <thead>",
  );
  process.exit(1);
}
if (!(ixActions < ixLeonix && ixLeonix < ixEnv)) {
  console.error(
    "verify-admin-listings-actions-column: expected column order Actions → Leonix → En venta in <thead>",
  );
  process.exit(1);
}
console.log(
  "OK: Actions column precedes Leonix and En venta columns (AdminListingsTable thead order).",
);
