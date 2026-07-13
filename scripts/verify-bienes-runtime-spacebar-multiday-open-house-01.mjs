#!/usr/bin/env node
/**
 * Verifier — Bienes Runtime Spacebar + Multi-day Open House 01
 * Runs Playwright browser proof (required) + fixture core.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}
function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

console.log("\n=== Bienes Runtime Spacebar + Multi-day Open House 01 ===\n");

assert(fs.existsSync(path.join(root, "e2e/bienes-raices/br-spacebar-multiday-open-house.spec.ts")), "playwright spec exists");
assert(read("package.json").includes("verify:bienes-runtime-spacebar-multiday-open-house-01"), "npm script registered");

console.log("--- Fixture core ---");
execFileSync("npx", ["tsx", "scripts/bienes-spacebar-multiday-open-house-01-core.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("\n--- Playwright browser runtime ---");
const brPort = String(process.env.BR_E2E_PORT ?? "3026").trim() || "3026";
execFileSync(
  "npx",
  [
    "playwright",
    "test",
    "-c",
    "playwright.br-runtime.config.mjs",
    "e2e/bienes-raices/br-spacebar-multiday-open-house.spec.ts",
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      BR_E2E_PORT: brPort,
      BR_E2E_BASE: `http://127.0.0.1:${brPort}`,
      PW_BR_E2E_REUSE: process.env.PW_BR_E2E_REUSE ?? "0",
    },
  },
);

console.log("\nverify:bienes-runtime-spacebar-multiday-open-house-01 PASS");
console.log("PROOF_TYPE: REAL BROWSER + FIXTURE");
