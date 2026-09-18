/**
 * Gate G2 — code-owned LessonPackage registry (stage 1). `resolveLessonPackage` is the single seam
 * the lesson page uses: an authored package when one exists, otherwise the deterministic legacy
 * adapter over the stored body. When packages move to a jsonb column, only this module changes.
 */
import { legacyLessonToPackage, type LegacyLessonInput } from "./legacyAdapter";
import { WHO_IS_YOUR_CUSTOMER_PACKAGE } from "./packages/whoIsYourCustomer";
import type { LessonPackage } from "./types";

export const CODE_OWNED_LESSON_PACKAGES: Readonly<Record<string, LessonPackage>> = {
  [WHO_IS_YOUR_CUSTOMER_PACKAGE.lessonKey]: WHO_IS_YOUR_CUSTOMER_PACKAGE,
};

export function getCodeOwnedLessonPackage(lessonKey: string): LessonPackage | null {
  return CODE_OWNED_LESSON_PACKAGES[lessonKey] ?? null;
}

/** Callers pass an already-PUBLISHED lesson row; this never decides publish state. */
export function resolveLessonPackage(lesson: LegacyLessonInput, relatedResourceKeys: readonly string[] = []): LessonPackage {
  return getCodeOwnedLessonPackage(lesson.lessonKey) ?? legacyLessonToPackage(lesson, relatedResourceKeys);
}
