import { HEALTH_DIMENSION_KEYS } from "../healthMap/constants";
import type { CapabilitySource, LessonLevel, LessonStatus, ResourceType } from "./types";

export const LEARNING_CENTER_FLAG_KEY = "business_learning_center";

/** Minimum bilingual body length (characters) required for a lesson to be publishable -- mirrors the migration CHECK plus the locked content-quality floor. */
export const MIN_PUBLISHED_BODY_LENGTH = 1200;

export type LabeledOption<T extends string> = { value: T; es: string; en: string };

export const LESSON_LEVELS: readonly LabeledOption<LessonLevel>[] = [
  { value: "foundation", es: "Fundamento", en: "Foundation" },
  { value: "practical", es: "Practico", en: "Practical" },
  { value: "advanced", es: "Avanzado", en: "Advanced" },
];

export const LESSON_STATUSES: readonly LabeledOption<LessonStatus>[] = [
  { value: "planned", es: "Planeado", en: "Planned" },
  { value: "draft", es: "Borrador", en: "Draft" },
  { value: "published", es: "Publicado", en: "Published" },
  { value: "archived", es: "Archivado", en: "Archived" },
];

export const RESOURCE_TYPES: readonly LabeledOption<ResourceType>[] = [
  { value: "glossary_term", es: "Termino del glosario", en: "Glossary term" },
  { value: "checklist", es: "Lista de verificacion", en: "Checklist" },
  { value: "template", es: "Plantilla", en: "Template" },
];

export const CAPABILITY_SOURCES: readonly LabeledOption<CapabilitySource>[] = [
  { value: "lesson_completed", es: "Leccion completada", en: "Lesson completed" },
  { value: "action_completed", es: "Accion completada", en: "Action completed" },
  { value: "staff_confirmed", es: "Confirmado por el equipo", en: "Staff confirmed" },
];

/** Reuses the Gate BCO-6A canonical dimension keys -- never a duplicated dimension list. */
export const KNOWN_HEALTH_DIMENSION_KEYS: readonly string[] = HEALTH_DIMENSION_KEYS;
