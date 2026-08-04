/**
 * Pure Learning Center decision/shaping logic -- deliberately NOT "server-only" (no I/O, no
 * secret) so it is directly unit-testable, matching featureFlagLogic.ts / healthMap/logic.ts.
 */
import { KNOWN_HEALTH_DIMENSION_KEYS, MIN_PUBLISHED_BODY_LENGTH } from "./constants";
import type { CapabilitySource, LearningLesson, LearningLessonSummary, LearningResource } from "./types";

/** Never expose a lesson body from a catalog-list endpoint. */
export function toLessonSummary(lesson: LearningLesson): LearningLessonSummary {
  const { bodyEs: _bodyEs, bodyEn: _bodyEn, ...summary } = lesson;
  return summary;
}

/** Public catalog / search may only ever include published lessons. */
export function filterPublishedLessons(lessons: readonly LearningLesson[]): LearningLesson[] {
  return lessons.filter((l) => l.status === "published");
}

export function filterPublishedResources(resources: readonly LearningResource[]): LearningResource[] {
  return resources.filter((r) => r.status === "published");
}

/** A publishable lesson must have a real, non-empty bilingual body meeting the locked quality floor. */
export function isPublishableBody(bodyEs: string | null, bodyEn: string | null): boolean {
  return (
    typeof bodyEs === "string" &&
    bodyEs.trim().length >= MIN_PUBLISHED_BODY_LENGTH &&
    typeof bodyEn === "string" &&
    bodyEn.trim().length >= MIN_PUBLISHED_BODY_LENGTH
  );
}

export function isKnownHealthDimensionKey(key: string): boolean {
  return KNOWN_HEALTH_DIMENSION_KEYS.includes(key);
}

/** Simple case-insensitive substring search over title/summary in the requested language. Public routes only ever call this with already-published lessons. */
export function searchPublishedLessons(lessons: readonly LearningLesson[], query: string, lang: "es" | "en"): LearningLesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return filterPublishedLessons(lessons);
  return filterPublishedLessons(lessons).filter((l) => {
    const title = (lang === "es" ? l.titleEs : l.titleEn).toLowerCase();
    const summary = (lang === "es" ? l.summaryEs : l.summaryEn).toLowerCase();
    return title.includes(q) || summary.includes(q);
  });
}

export function groupLessonsByCategory(lessons: readonly LearningLesson[]): Map<string, LearningLesson[]> {
  const map = new Map<string, LearningLesson[]>();
  for (const lesson of lessons) {
    const list = map.get(lesson.categoryId) ?? [];
    list.push(lesson);
    map.set(lesson.categoryId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
  return map;
}

/** Deterministic capability-grant decision for a completed lesson -- never AI-inferred. */
export function buildLessonCompletionCapabilityGrant(lesson: LearningLesson): {
  capabilityKey: string;
  source: CapabilitySource;
  sourceLessonId: string;
} {
  return { capabilityKey: lesson.capabilityKey, source: "lesson_completed", sourceLessonId: lesson.id };
}
