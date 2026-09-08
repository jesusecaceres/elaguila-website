/**
 * Globalization P2 — Gate 2: Community/Clases Preview hook-order repair self-test.
 *
 * CommunityQuickPreviewClient.tsx crashed with a Rules-of-Hooks violation: `cardModel`'s
 * `useMemo` was declared AFTER two early `return` statements (`!ready`, `!draft`), so it ran on
 * some renders and not others — a different hook count between the initial render and later ones.
 * This proves, at the source level, that every hook now appears before any `return` statement in
 * the component body, and that the memo is null-safe.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-p2-community-preview-hook-order-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const TARGET = "app/(site)/publicar/community/shared/preview/CommunityQuickPreviewClient.tsx";

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const src = readSource(TARGET);

const componentStart = src.indexOf("export function CommunityQuickPreviewClient(");
assert.ok(componentStart > -1, "component export must exist");
const body = src.slice(componentStart);

/* ================================================================================================
 * 1. There must be exactly one `if (!ready)` early return and one `if (!draft)` early return, and
 * both must appear AFTER every hook call (useSearchParams, useMemo, useState, useLayoutEffect,
 * useEffect) — never before, and no hook may appear between/after them.
 * ============================================================================================== */
const readyReturnIdx = body.indexOf("if (!ready) {");
const draftReturnIdx = body.indexOf("if (!draft) {");
assert.ok(readyReturnIdx > -1, "the !ready early return must still exist");
assert.ok(draftReturnIdx > -1, "the !draft early return must still exist");
assert.ok(readyReturnIdx < draftReturnIdx, "the !ready check must come before the !draft check");

const beforeReturns = body.slice(0, readyReturnIdx);
const afterFirstReturn = body.slice(readyReturnIdx);

const hookCallPattern = /\b(useState|useEffect|useLayoutEffect|useMemo|useCallback|useRef|useContext|useReducer)\s*(?:<[^(]*?>)?\s*\(/g;

const hooksBefore = [...beforeReturns.matchAll(hookCallPattern)].map((m) => m[1]);
const hooksAfter = [...afterFirstReturn.matchAll(hookCallPattern)].map((m) => m[1]);

assert.ok(hooksBefore.length >= 6, `expected at least 6 hook calls before the early returns (useSearchParams via import + useMemo + 3x useState + useLayoutEffect + useEffect + the cardModel useMemo), found ${hooksBefore.length}: ${hooksBefore.join(", ")}`);
assert.equal(hooksAfter.length, 0, `no hook may be called after the !ready early return — found: ${hooksAfter.join(", ")}`);

/* ================================================================================================
 * 2. The cardModel useMemo specifically must be declared before the early returns, and must be
 * null-safe (returns null when draft is falsy), since draft can still be null when this hook runs
 * on the first render.
 * ============================================================================================== */
const cardModelIdx = body.indexOf("const cardModel = useMemo(");
assert.ok(cardModelIdx > -1, "cardModel useMemo must exist");
assert.ok(cardModelIdx < readyReturnIdx, "cardModel useMemo must be declared before the !ready early return");

const cardModelBlockEnd = body.indexOf("}, [draft, kind, lang]);", cardModelIdx);
assert.ok(cardModelBlockEnd > -1, "cardModel useMemo must keep its [draft, kind, lang] dependency array");
const cardModelBody = body.slice(cardModelIdx, cardModelBlockEnd);
assert.ok(/if\s*\(!draft\)\s*return\s*null;/.test(cardModelBody), "cardModel's memo body must guard against a null draft and return null safely");

/* ================================================================================================
 * 3. Only one definition of cardModel must exist (the old, duplicate, post-return declaration must
 * be fully removed, not left as dead code).
 * ============================================================================================== */
const cardModelDeclarationCount = (body.match(/const cardModel = useMemo\(/g) ?? []).length;
assert.equal(cardModelDeclarationCount, 1, `cardModel must be declared exactly once, found ${cardModelDeclarationCount}`);

console.log("gate-p2-community-preview-hook-order-selftest: OK");
