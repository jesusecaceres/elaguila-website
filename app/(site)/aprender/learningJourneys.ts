/**
 * Learning Center — Phase 1 code-owned journey / roadmap / start-here map.
 *
 * Pure module (no I/O, no server-only guard) so it is directly testable from
 * scripts/verify-business-learning-center-01.ts. Every resolver takes the PUBLISHED catalog as
 * input and silently drops any key that is not published, so this map can never surface a
 * planned/draft lesson or invent a count. When the data model gains journey/stage columns
 * (blueprint Phase 5) this map is replaced by repository reads; the component contracts stay.
 */
import type { SupportedLang } from "@/app/lib/language";
import { withLang } from "@/app/lib/language";
import type { LearningCategory, LearningLesson } from "@/app/lib/business/learning/types";
import type { LearningJourneyKey, LearningRoadmapStageKey } from "./learningCopy";

export const LEARNING_JOURNEY_KEYS: readonly LearningJourneyKey[] = ["idea", "empezando", "negocio"];

export const LEARNING_ROADMAP_STAGE_KEYS: readonly LearningRoadmapStageKey[] = [
  "idea",
  "cliente",
  "marca",
  "numeros",
  "preparacion",
  "lanzamiento",
  "crecimiento",
];

/** Ordered published-lesson sequence per journey (blueprint §11). Keys must be real lesson_keys. */
export const LEARNING_JOURNEY_LESSON_KEYS: Record<LearningJourneyKey, readonly string[]> = {
  idea: ["who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity"],
  empezando: [
    "consistent_business_information",
    "who_is_your_customer",
    "google_business_basics",
    "whatsapp_business_basics",
    "advertising_fundamentals",
  ],
  negocio: [
    "revenue_vs_profit",
    "consistent_business_information",
    "google_business_basics",
    "reviews_and_customer_response",
    "advertising_fundamentals",
    "healthy_boundaries_and_capacity",
  ],
};

/** One primary roadmap stage per lesson_key (blueprint §11). Unmapped lessons simply do not appear on the roadmap. */
export const LEARNING_LESSON_STAGE: Record<string, LearningRoadmapStageKey> = {
  who_is_your_customer: "cliente",
  revenue_vs_profit: "numeros",
  consistent_business_information: "preparacion",
  healthy_boundaries_and_capacity: "preparacion",
  google_business_basics: "lanzamiento",
  whatsapp_business_basics: "lanzamiento",
  advertising_fundamentals: "lanzamiento",
  reviews_and_customer_response: "crecimiento",
};

/** Curated "Empieza aquí" order (Gate L1E). Rendered only when published. */
export const LEARNING_START_HERE_KEYS: readonly string[] = [
  "who_is_your_customer",
  "revenue_vs_profit",
  "consistent_business_information",
  "google_business_basics",
  "reviews_and_customer_response",
];

export const LEARNING_ANCHORS = {
  journeys: "donde-estas",
  roadmap: "ruta",
  startHere: "empieza-aqui",
  topics: "temas",
  toolkit: "kit",
  method: "metodo",
} as const;

/** Existing routes only (Gate L1 scope). */
export const LEARNING_ROUTES = {
  home: "/aprender",
  glossary: "/aprender/glosario",
  resources: "/aprender/recursos",
  ideaBuilder: "/dashboard/business-tools/idea-builder",
} as const;

/**
 * Phase 1 journey links stay on the landing (`?journey=` + anchor). Flip this constant to "route"
 * in Phase 2 once `/aprender/ruta/[journeyKey]` exists — every card/CTA picks it up.
 */
export const LEARNING_JOURNEY_LINK_MODE: "query" | "route" = "query";

export function buildJourneyHref(journey: LearningJourneyKey, routeLang: SupportedLang): string {
  if (LEARNING_JOURNEY_LINK_MODE === "route") {
    return withLang(`${LEARNING_ROUTES.home}/ruta/${journey}`, routeLang);
  }
  return withLang(`${LEARNING_ROUTES.home}#${LEARNING_ANCHORS.journeys}`, routeLang, { journey });
}

export function lessonHref(lessonKey: string, routeLang: SupportedLang): string {
  return withLang(`${LEARNING_ROUTES.home}/leccion/${lessonKey}`, routeLang);
}

export function categoryHref(categoryKey: string, routeLang: SupportedLang): string {
  return withLang(`${LEARNING_ROUTES.home}/${categoryKey}`, routeLang);
}

export function isLearningJourneyKey(value: unknown): value is LearningJourneyKey {
  return typeof value === "string" && (LEARNING_JOURNEY_KEYS as readonly string[]).includes(value);
}

export function journeyFromSearchParams(sp: Record<string, string | string[] | undefined> | undefined): LearningJourneyKey | null {
  const raw = sp?.journey;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isLearningJourneyKey(value) ? value : null;
}

function publishedByKey(lessons: readonly LearningLesson[]): Map<string, LearningLesson> {
  const map = new Map<string, LearningLesson>();
  for (const l of lessons) if (l.status === "published") map.set(l.lessonKey, l);
  return map;
}

/** Ordered published lessons for a journey; unknown/unpublished keys are dropped silently. */
export function resolveJourneyLessons(journey: LearningJourneyKey, lessons: readonly LearningLesson[]): LearningLesson[] {
  const byKey = publishedByKey(lessons);
  const out: LearningLesson[] = [];
  for (const key of LEARNING_JOURNEY_LESSON_KEYS[journey]) {
    const l = byKey.get(key);
    if (l) out.push(l);
  }
  return out;
}

export function resolveAllJourneys(lessons: readonly LearningLesson[]): Record<LearningJourneyKey, LearningLesson[]> {
  return {
    idea: resolveJourneyLessons("idea", lessons),
    empezando: resolveJourneyLessons("empezando", lessons),
    negocio: resolveJourneyLessons("negocio", lessons),
  };
}

/** Journey labels for a lesson (first journey that contains it wins for a single chip). */
export function journeysForLesson(lessonKey: string): LearningJourneyKey[] {
  return LEARNING_JOURNEY_KEYS.filter((j) => LEARNING_JOURNEY_LESSON_KEYS[j].includes(lessonKey));
}

export type RoadmapStageView = {
  key: LearningRoadmapStageKey;
  index: number;
  lessons: LearningLesson[];
};

/** Roadmap stages with their published lessons (a stage with none renders "En preparación", never 0). */
export function resolveRoadmapStages(lessons: readonly LearningLesson[]): RoadmapStageView[] {
  const published = [...lessons].filter((l) => l.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
  return LEARNING_ROADMAP_STAGE_KEYS.map((key, index) => ({
    key,
    index,
    lessons: published.filter((l) => LEARNING_LESSON_STAGE[l.lessonKey] === key),
  }));
}

/** Curated start-here lessons; silently omits anything not published. */
export function resolveStartHereLessons(lessons: readonly LearningLesson[]): LearningLesson[] {
  const byKey = publishedByKey(lessons);
  const out: LearningLesson[] = [];
  for (const key of LEARNING_START_HERE_KEYS) {
    const l = byKey.get(key);
    if (l) out.push(l);
  }
  return out;
}

export type TopicTileView = {
  category: LearningCategory;
  publishedCount: number;
};

/** Active categories that have at least one published lesson (empty categories are hidden, never "0 lessons"). */
export function resolveTopicTiles(categories: readonly LearningCategory[], lessons: readonly LearningLesson[]): TopicTileView[] {
  const counts = new Map<string, number>();
  for (const l of lessons) {
    if (l.status !== "published") continue;
    counts.set(l.categoryId, (counts.get(l.categoryId) ?? 0) + 1);
  }
  return [...categories]
    .filter((c) => c.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({ category, publishedCount: counts.get(category.id) ?? 0 }))
    .filter((t) => t.publishedCount > 0);
}

/** Sum of real estimated minutes — only ever computed from published lessons. */
export function totalMinutes(lessons: readonly LearningLesson[]): number {
  return lessons.reduce((sum, l) => sum + (Number.isFinite(l.estimatedMinutes) ? l.estimatedMinutes : 0), 0);
}
