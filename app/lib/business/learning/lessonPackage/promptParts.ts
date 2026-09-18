/**
 * Gate G4 — shared building blocks for stage-aware AI template sets (Bible §44A). Kept apart from
 * the registry (`prompts.ts`) so each lesson's template set can live in its own module without an
 * import cycle. Plain data and pure helpers only.
 */
import type { L, LessonJourneyKey, LessonLang, LessonPrompt, LessonPromptField } from "./types";

export type Stage = LessonJourneyKey | "neutral";
export const STAGES: readonly Stage[] = ["neutral", "idea", "empezando", "negocio"];

const join = (lang: LessonLang, ...blocks: L[]): string => blocks.map((b) => b[lang]).join("\n\n");
/** Joins bilingual paragraphs with a blank line between them. */
export const both = (...blocks: L[]): L => ({ es: join("es", ...blocks), en: join("en", ...blocks) });

/** One body per stage → the `body` (neutral) + `variants` shape a LessonPrompt stores. */
export function composeStages(build: (stage: Stage) => L): { body: L; variants: Record<LessonJourneyKey, { body: L }> } {
  return { body: build("neutral"), variants: { idea: { body: build("idea") }, empezando: { body: build("empezando") }, negocio: { body: build("negocio") } } };
}

export const MENTOR: L = {
  es: "Actúa como un mentor de negocios paciente y usa lenguaje sencillo.",
  en: "Act as a patient business mentor and use plain language.",
};

export const STAGE_LABELS: Record<LessonJourneyKey, L> = {
  idea: { es: "tengo una idea y todavía no vendo", en: "I have an idea and I am not selling yet" },
  empezando: { es: "estoy empezando", en: "I am just getting started" },
  negocio: { es: "ya opero mi negocio", en: "I am already operating my business" },
};

export const PRIVACY: LessonPrompt["privacy"] = {
  intro: { es: "Antes de pegar algo en una IA, quita los datos de personas reales. No pegues de tus clientes:", en: "Before you paste anything into an AI, remove real people's details. Do not paste your customers':" },
  never: [
    { es: "nombres completos", en: "full names" },
    { es: "números de teléfono", en: "phone numbers" },
    { es: "direcciones", en: "addresses" },
    { es: "información privada de cuentas", en: "private account information" },
  ],
};

/** Opening line for template sets whose lab asks for the business idea in the learner's own words. */
export const OPENER_WITH_IDEA: Record<Stage, L> = {
  neutral: {
    es: "Tengo, o estoy pensando en tener, un negocio pequeño en [[city]]: [[idea]]. Mi etapa: [[stage]].",
    en: "I have, or am thinking about having, a small business in [[city]]: [[idea]]. My stage: [[stage]].",
  },
  idea: {
    es: "Estoy pensando en empezar un negocio pequeño en [[city]]: [[idea]]. Todavía no vendo: estoy explorando la idea antes de gastar dinero.",
    en: "I am thinking about starting a small business in [[city]]: [[idea]]. I am not selling yet: I am exploring the idea before I spend money.",
  },
  empezando: {
    es: "Ya decidí empezar un negocio pequeño en [[city]]: [[idea]]. Me estoy preparando para atender a mis primeros clientes.",
    en: "I have decided to start a small business in [[city]]: [[idea]]. I am getting ready to serve my first customers.",
  },
  negocio: {
    es: "Ya opero un negocio pequeño en [[city]]: [[idea]].",
    en: "I already operate a small business in [[city]]: [[idea]].",
  },
};

/** Fields the learner fills in the AI lab itself (they do not come from the activity). */
export const IDEA_FIELD: LessonPromptField = {
  token: "idea",
  label: { es: "Tu idea o negocio, en pocas palabras", en: "Your idea or business, in a few words" },
  placeholder: { es: "tu idea o negocio", en: "your idea or business" },
};
export const CUSTOMER_FIELD: LessonPromptField = {
  token: "customer",
  label: { es: "Tu cliente, en una frase", en: "Your customer, in one sentence" },
  placeholder: { es: "a quién sirves", en: "who you serve" },
};
export const CITY_FIELD: LessonPromptField = { token: "city", label: { es: "Tu ciudad o zona", en: "Your city or area" }, placeholder: { es: "ciudad", en: "city" } };
export const STAGE_FIELD: LessonPromptField = {
  token: "stage",
  label: { es: "Tu etapa", en: "Your stage" },
  placeholder: { es: "idea / empezando / ya opero", en: "idea / getting started / already operating" },
  prefillFrom: { kind: "journey_stage" },
};

/** Builds an activity-linked field (token name = activity field key). */
export function activityField(fieldKey: string, label: L, placeholder: L): LessonPromptField {
  return { token: fieldKey, label, placeholder, prefillFrom: { kind: "activity_field", fieldKey } };
}
