import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const ROOT = process.cwd();

export function read(rel) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) throw new Error(`Missing required file: ${rel}`);
  return readFileSync(path, "utf8");
}

export function assertContains(haystack, needle, label) {
  if (needle instanceof RegExp) {
    if (!needle.test(haystack)) throw new Error(`Missing ${label}: ${needle}`);
    return;
  }
  if (!haystack.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}

export function assertNotContains(haystack, needle, label) {
  if (needle instanceof RegExp) {
    if (needle.test(haystack)) throw new Error(`Forbidden ${label}: ${needle}`);
    return;
  }
  if (haystack.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
}

export function pass(name) {
  console.log(`PASS ${name}`);
}
