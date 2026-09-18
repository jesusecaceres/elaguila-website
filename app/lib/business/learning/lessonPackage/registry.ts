/**
 * Gate G2 — code-owned LessonPackage registry (stage 1). `resolveLessonPackage` is the single seam
 * the lesson page uses: an authored package when one exists, otherwise the deterministic legacy
 * adapter over the stored body. When packages move to a jsonb column, only this module changes.
 */
import { legacyLessonToPackage, type LegacyLessonInput } from "./legacyAdapter";
import { CUSTOMER_CONVERSATIONS_PACKAGE } from "./packages/customerConversations";
import { KNOW_YOUR_COMPETITION_PACKAGE } from "./packages/knowYourCompetition";
import { WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE } from "./packages/whatProblemDoYouSolve";
import { WHO_IS_YOUR_CUSTOMER_PACKAGE } from "./packages/whoIsYourCustomer";
import type { LessonPackage } from "./types";

export const CODE_OWNED_LESSON_PACKAGES: Readonly<Record<string, LessonPackage>> = {
  [WHO_IS_YOUR_CUSTOMER_PACKAGE.lessonKey]: WHO_IS_YOUR_CUSTOMER_PACKAGE,
  // Gate G4-I1 — Idea batch 1. A package renders only once its database row is published.
  [WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE.lessonKey]: WHAT_PROBLEM_DO_YOU_SOLVE_PACKAGE,
  [CUSTOMER_CONVERSATIONS_PACKAGE.lessonKey]: CUSTOMER_CONVERSATIONS_PACKAGE,
  [KNOW_YOUR_COMPETITION_PACKAGE.lessonKey]: KNOW_YOUR_COMPETITION_PACKAGE,
};

export function getCodeOwnedLessonPackage(lessonKey: string): LessonPackage | null {
  return CODE_OWNED_LESSON_PACKAGES[lessonKey] ?? null;
}

/** Callers pass an already-PUBLISHED lesson row; this never decides publish state. */
export function resolveLessonPackage(lesson: LegacyLessonInput, relatedResourceKeys: readonly string[] = []): LessonPackage {
  return getCodeOwnedLessonPackage(lesson.lessonKey) ?? legacyLessonToPackage(lesson, relatedResourceKeys);
}
