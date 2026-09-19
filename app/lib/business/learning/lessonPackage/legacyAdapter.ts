/**
 * Gate G2 — deterministic legacy adapter. Published lessons that do not have an authored
 * LessonPackage yet still store one plain-text body per language. This module turns that stored
 * body into an honest, reduced LessonPackage (`source: "legacy"`) so every published lesson renders
 * through the same visual shell — never as one whitespace-pre-line essay again.
 *
 * Doctrine: the adapter re-ARRANGES stored content, it never writes teaching material. Every
 * sentence it emits is a verbatim slice of the stored body; the only words it adds are the three
 * structural section labels below (correctly accented chrome). No hook, example, activity, AI
 * prompt or audio is fabricated — a legacy lesson simply has fewer blocks than a flagship one.
 *
 * Pure: no I/O, no server-only guard.
 */
import { LESSON_PACKAGE_SCHEMA_VERSION, type L, type LessonBlock, type LessonPackage } from "./types";

export type LegacyLessonInput = {
  lessonKey: string;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  bodyEs: string | null;
  bodyEn: string | null;
  estimatedMinutes: number;
};

export const LEGACY_SECTION_LABELS = {
  why: { es: "Por qué importa", en: "Why it matters" },
  steps: { es: "Pasos prácticos", en: "Practical steps" },
  note: { es: "Un dato importante", en: "An important note" },
} as const satisfies Record<string, L>;

const WHY_RE = /^(?:por qu[eé] importa|why it matters)\s*:\s*/i;
const STEPS_RE = /^(?:pasos pr[aá]cticos|practical steps)\s*:\s*/i;
const NOTE_RE = /^(?:un dato importante|an important note)\s*:\s*/i;
const STEP_LINE_RE = /^\s*\d+[.)]\s+/;

export type ParsedLegacyBody = {
  structured: boolean;
  intro: string[];
  why: string | null;
  steps: string[];
  note: string | null;
  /** Paragraphs in stored order — used when the body does not follow the known structure. */
  paragraphs: string[];
};

/** Splits one stored body into its recognisable parts. Text is only trimmed, never reworded. */
export function parseLegacyBody(body: string | null | undefined): ParsedLegacyBody {
  const paragraphs = (body ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const intro: string[] = [];
  let why: string | null = null;
  let steps: string[] = [];
  let note: string | null = null;
  let unexpected = false;

  for (const p of paragraphs) {
    if (WHY_RE.test(p) && why === null) {
      why = p.replace(WHY_RE, "").trim();
    } else if (STEPS_RE.test(p) && steps.length === 0) {
      const lines = p
        .replace(STEPS_RE, "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length > 0 && lines.every((l) => STEP_LINE_RE.test(l))) steps = lines.map((l) => l.replace(STEP_LINE_RE, "").trim());
      else unexpected = true;
    } else if (NOTE_RE.test(p) && note === null) {
      note = p.replace(NOTE_RE, "").trim();
    } else if (why === null && steps.length === 0 && note === null) {
      intro.push(p);
    } else {
      unexpected = true;
    }
  }

  const structured = !unexpected && intro.length > 0 && why !== null && steps.length > 0 && note !== null;
  return { structured, intro, why, steps, note, paragraphs };
}

function pair(es: string | undefined, en: string | undefined): L {
  return { es: es ?? "", en: en ?? "" };
}

export function legacyLessonToPackage(lesson: LegacyLessonInput, relatedResourceKeys: readonly string[] = []): LessonPackage {
  const es = parseLegacyBody(lesson.bodyEs);
  const en = parseLegacyBody(lesson.bodyEn);
  const blocks: LessonBlock[] = [];

  const sameShape = es.structured && en.structured && es.intro.length === en.intro.length && es.steps.length === en.steps.length;

  if (sameShape) {
    blocks.push({
      id: "legacy-explain",
      type: "explain",
      chunks: [
        ...es.intro.map((p, i) => ({ body: pair(p, en.intro[i]) })),
        { heading: LEGACY_SECTION_LABELS.why, body: pair(es.why ?? "", en.why ?? "") },
      ],
    });
    blocks.push({ id: "legacy-steps", type: "steps", title: LEGACY_SECTION_LABELS.steps, items: es.steps.map((s, i) => pair(s, en.steps[i])) });
    blocks.push({ id: "legacy-note", type: "note", body: pair(es.note ?? "", en.note ?? "") });
  } else {
    // Unknown shape: still never one essay box — one short chunk per stored paragraph, in stored order.
    const count = Math.max(es.paragraphs.length, en.paragraphs.length);
    blocks.push({
      id: "legacy-explain",
      type: "explain",
      chunks: Array.from({ length: count }, (_, i) => ({ body: pair(es.paragraphs[i], en.paragraphs[i]) })),
    });
  }

  if (relatedResourceKeys.length > 0) blocks.push({ id: "legacy-resources", type: "resource", resourceKeys: [...relatedResourceKeys] });

  return {
    schemaVersion: LESSON_PACKAGE_SCHEMA_VERSION,
    lessonKey: lesson.lessonKey,
    source: "legacy",
    meta: {
      title: pair(lesson.titleEs, lesson.titleEn),
      outcome: pair(lesson.summaryEs, lesson.summaryEn),
      readMinutes: lesson.estimatedMinutes,
      truthClass: "evergreen",
      consequential: false,
    },
    blocks,
  };
}
