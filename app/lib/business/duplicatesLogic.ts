/**
 * Pure duplicate-detection helpers — deliberately NOT "server-only" so they're directly
 * unit-testable (see featureFlagLogic.ts for the rationale). duplicates.ts (server-only,
 * performs the actual DB reads) imports and re-exports these.
 */
import type { DuplicateLevel } from "./types";

export function maskDisplayName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 3) return `${trimmed[0] ?? ""}***`;
  return `${trimmed.slice(0, 3)}${"*".repeat(Math.max(3, trimmed.length - 3))}`;
}

export function wordOverlapScore(a: string, b: string): number {
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared += 1;
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function levelRank(level: DuplicateLevel): number {
  return { none: 0, possible: 1, probable: 2, exact: 3 }[level];
}
