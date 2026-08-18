import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
export const repoRoot = path.resolve(path.dirname(__filename), "..");

export function readRepoFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

export function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) {
    throw new Error(`${label} missing ${JSON.stringify(needle)}`);
  }
}

export function assertNotIncludes(label, text, needle) {
  if (text.includes(needle)) {
    throw new Error(`${label} must not include ${JSON.stringify(needle)}`);
  }
}

export function pass(message) {
  console.log(`PASS: ${message}`);
}
