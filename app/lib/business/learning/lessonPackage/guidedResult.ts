/**
 * Gate G4 — pure logic behind every guided-fields activity other than the flagship sentence
 * builder. The result (a sentence and/or a sheet of labelled sections) is assembled ONLY from what
 * the learner typed: a missing answer stays a visible blank; nothing is guessed, completed or
 * generated, and nothing leaves the browser.
 */
import type { ActivityField, ActivityResult, LessonLang } from "./types";

export const MAX_GUIDED_ANSWER_LENGTH = 160;
export const MAX_GUIDED_MULTILINE_LENGTH = 600;

export type GuidedPart = { kind: "text"; text: string } | { kind: "answer" | "blank"; text: string; fieldKey: string };
export type GuidedSection = { label: string; lines: GuidedPart[] };

export function maxGuidedLength(field: Pick<ActivityField, "multiline">): number {
  return field.multiline ? MAX_GUIDED_MULTILINE_LENGTH : MAX_GUIDED_ANSWER_LENGTH;
}

/** Single-line answers: collapse whitespace and drop edge punctuation (the sentence adds its own). */
export function cleanGuidedAnswer(raw: string | undefined | null, multiline = false): string {
  const text = raw ?? "";
  if (multiline) {
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_GUIDED_MULTILINE_LENGTH);
  }
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_GUIDED_ANSWER_LENGTH)
    .replace(/^[\s.,;:]+/u, "")
    .replace(/[\s.。,;:!?¡¿]+$/u, "");
}

function blankFor(field: ActivityField | undefined, key: string, lang: LessonLang): string {
  const name = field ? (field.blankLabel ?? field.label)[lang] : key;
  return `[${name.replace(/[¿?:]/g, "").trim().toLowerCase()}]`;
}

export function buildGuidedResult(
  fields: readonly ActivityField[],
  result: ActivityResult,
  answers: Readonly<Record<string, string | undefined>>,
  lang: LessonLang,
): { sentence: GuidedPart[]; sections: GuidedSection[]; text: string; filledCount: number; total: number; complete: boolean } {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const part = (key: string): GuidedPart => {
    const field = byKey.get(key);
    const answer = cleanGuidedAnswer(answers[key], Boolean(field?.multiline));
    return answer ? { kind: "answer", text: answer, fieldKey: key } : { kind: "blank", text: blankFor(field, key, lang), fieldKey: key };
  };

  const sentence: GuidedPart[] = [];
  const template = result.sentence?.[lang] ?? "";
  if (template) {
    let last = 0;
    for (const m of template.matchAll(/\[\[([a-z_]+)\]\]/g)) {
      const idx = m.index ?? 0;
      if (idx > last) sentence.push({ kind: "text", text: template.slice(last, idx) });
      sentence.push(part(m[1]));
      last = idx + m[0].length;
    }
    if (last < template.length) sentence.push({ kind: "text", text: template.slice(last) });
  }

  const sections: GuidedSection[] = (result.sections ?? []).map((s) => ({ label: s.label[lang], lines: s.fieldKeys.map(part) }));

  const filledCount = fields.filter((f) => cleanGuidedAnswer(answers[f.key], Boolean(f.multiline)).length > 0).length;
  const textBlocks: string[] = [];
  if (sentence.length > 0) textBlocks.push(sentence.map((p) => p.text).join(""));
  for (const s of sections) textBlocks.push(`${s.label}:\n${s.lines.map((l) => l.text).join("\n")}`);

  return { sentence, sections, text: textBlocks.join("\n\n"), filledCount, total: fields.length, complete: filledCount === fields.length };
}
