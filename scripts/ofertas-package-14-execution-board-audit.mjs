import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const board = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_14_QA_EXECUTION_BOARD.md"), "utf8");

const columns = ["ID", "SYSTEM", "PRECONDITION", "TEST ACCOUNT", "PARENT UUID", "LEONIX AD ID", "EXPECTED RESULT", "ACTUAL RESULT", "EVIDENCE", "DEFECT ID", "OWNER", "STATUS", "RETEST", "PASS CRITERIA"];
for (const column of columns) {
  if (!board.includes(column)) throw new Error(`Execution board missing column ${column}`);
}

for (let id = 1; id <= 47; id += 1) {
  const marker = `QA14-${String(id).padStart(2, "0")}`;
  if (!board.includes(marker)) throw new Error(`Execution board missing row ${marker}`);
}

for (const marker of [
  "environment identity",
  "migration chain",
  "verified partner flyer advertiser",
  "Gemini scan",
  "product review/correction",
  "crop and bounding box",
  "Ofertas Preview",
  "Stripe test checkout",
  "webhook",
  "entitlement",
  "Admin rejection",
  "owner correction",
  "public activation",
  "coupon shopping-list exclusion",
  "analytics",
  "owner acceptance",
  "No fake results",
]) {
  if (!board.includes(marker)) throw new Error(`Execution board missing ${marker}`);
}

if (/owner PASS/i.test(board) && !board.includes("No fake results")) {
  throw new Error("Execution board must not allow owner PASS without real evidence.");
}

console.log("PASS: Package 14 QA execution board covers required systems and evidence fields.");
