import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ROOT = process.cwd();

export function read(rel) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) throw new Error(`Missing ${rel}`);
  return readFileSync(path, "utf8");
}

export function must(text, pattern, label) {
  if (pattern instanceof RegExp ? !pattern.test(text) : !text.includes(pattern)) {
    throw new Error(`Missing ${label}: ${pattern}`);
  }
}

export function mustNot(text, pattern, label) {
  if (pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern)) {
    throw new Error(`Forbidden ${label}: ${pattern}`);
  }
}

export function pass(name) {
  console.log(`PASS ${name}`);
}
