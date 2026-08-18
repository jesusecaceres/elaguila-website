import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["ls-files", "app", "scripts", "docs"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => file.startsWith("app/") || file.includes("OFERTAS_PACKAGE_13") || file.includes("ofertas-package-13"))
  .filter((file) => file.includes("ofertas-locales") || file.includes("OFERTAS_PACKAGE_13") || file.includes("ofertas-package-13"))
  .filter((file) => !file.startsWith("scripts/ofertas-package-13-"))
  .filter((file) => !file.endsWith(".md") || file.startsWith("docs/OFERTAS_PACKAGE_13"));

const forbidden = [
  /onClick=\{\(\)\s*=>\s*\{\s*\}\}/,
  /href=["']#["']/,
  /TODO(?:[:\s].*)?(approve|payment|publish|redeem|cart|refund)/i,
  /\bfake_(success|metric|lead|redemption|payment|approval|publication|worker)\b/i,
  /fake (success|metric|lead|redemption|payment|approval|publication|worker) (shown|displayed|enabled|complete)/i,
  /\$598/,
  /optional AI/i,
  /manual package/i,
  /basic package/i,
];

for (const file of files) {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new Error(`Forbidden fake/dead action marker in ${file}: ${pattern}`);
  }
}

console.log("PASS: Package 13 fake state and dead action audit found no exposed Ofertas-owned defects.");
