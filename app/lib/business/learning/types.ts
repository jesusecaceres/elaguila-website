/**
 * TODAY-1 — Public Business Learning Center types. Mirrors the Gate BCO-5A/6A type conventions
 * exactly. A lesson is either "planned" (title/summary/metadata only, never publicly served) or
 * "published" (a real, non-empty bilingual body) -- the database CHECK constraint
 * business_learning_lessons_published_body_chk makes the latter structurally guaranteed.
 */

export type LessonLevel = "foundation" | "practical" | "advanced";

export type LessonStatus = "planned" | "draft" | "published" | "archived";

export type ResourceType = "glossary_term" | "checklist" | "template";

export type ResourceStatus = "draft" | "published" | "archived";

export type ProgressStatus = "started" | "completed";

export type CapabilitySource = "lesson_completed" | "action_completed" | "staff_confirmed";

/** Same dual-actor shape proven throughout Gate BCO-5A/6A -- never a bare string. */
export type LearningActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type LearningCategory = {
  id: string;
  categoryKey: string;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  sortOrder: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type LearningLesson = {
  id: string;
  categoryId: string;
  lessonKey: string;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  bodyEs: string | null;
  bodyEn: string | null;
  level: LessonLevel;
  estimatedMinutes: number;
  capabilityKey: string;
  relatedDimensionKeys: string[];
  status: LessonStatus;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Catalog/list shape -- never includes the lesson body. */
export type LearningLessonSummary = Omit<LearningLesson, "bodyEs" | "bodyEn">;

export type LearningResource = {
  id: string;
  lessonId: string | null;
  resourceKey: string;
  resourceType: ResourceType;
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
  status: ResourceStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type LearningProgress = {
  id: string;
  authUserId: string;
  businessId: string | null;
  lessonId: string;
  status: ProgressStatus;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CapabilityRecord = {
  id: string;
  authUserId: string;
  businessId: string | null;
  capabilityKey: string;
  source: CapabilitySource;
  sourceLessonId: string | null;
  sourceReferenceId: string | null;
  grantedAt: string;
  createdActorType: "staff" | "owner";
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
};
