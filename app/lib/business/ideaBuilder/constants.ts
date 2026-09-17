import type { IdeaBuilderPath, ReadinessCategory } from "./types";

export const IDEA_BUILDER_PATHS: readonly { value: IdeaBuilderPath; es: string; en: string }[] = [
  { value: "have_business", es: "Ya tengo un negocio", en: "I already have a business" },
  { value: "thinking_about_starting", es: "Estoy pensando en empezar uno", en: "I am thinking about starting one" },
];

export const READINESS_CATEGORIES: readonly { value: ReadinessCategory; es: string; en: string }[] = [
  { value: "startup_readiness", es: "Preparacion para empezar", en: "Startup readiness" },
  { value: "technology_readiness", es: "Preparacion tecnologica", en: "Technology readiness" },
  { value: "visibility_basics", es: "Fundamentos de visibilidad", en: "Visibility basics" },
  { value: "communication_basics", es: "Fundamentos de comunicacion", en: "Communication basics" },
];

export const MAX_TEXT_FIELD_LENGTH = 4000;
