/**
 * Gate G2 — pure logic behind the `customer_statement_builder` activity. The sentence is assembled
 * ONLY from what the learner typed. A missing answer stays a visible blank; nothing is guessed,
 * completed or generated, and nothing leaves the browser.
 */
import type { LessonLang } from "./types";

export const CUSTOMER_STATEMENT_FIELD_KEYS = ["offer", "who", "problem", "where", "why"] as const;
export type CustomerStatementFieldKey = (typeof CUSTOMER_STATEMENT_FIELD_KEYS)[number];
export type CustomerStatementAnswers = Partial<Record<CustomerStatementFieldKey, string>>;

export const MAX_STATEMENT_ANSWER_LENGTH = 160;

export type StatementPart = { kind: "text"; text: string } | { kind: "answer" | "blank"; text: string; fieldKey: CustomerStatementFieldKey };

/**
 * Grammar-safe by construction: no verb in the template has to agree in number or person with a
 * learner answer ("con [problema]" / "with [problem]" instead of "que necesita" / "who need"), so
 * "familias" and "una familia" both read correctly. All five answers are used.
 */
const TEMPLATE: Record<LessonLang, readonly (string | CustomerStatementFieldKey)[]> = {
  es: ["Ayudo a ", "who", " con ", "problem", " en ", "where", " ofreciendo ", "offer", ". Me eligen porque ", "why", "."],
  en: ["I help ", "who", " with ", "problem", " in ", "where", " by offering ", "offer", ". They choose me because ", "why", "."],
};

/** Short names shown inside a blank, e.g. "[quién]". */
export const STATEMENT_BLANK_LABELS: Record<LessonLang, Record<CustomerStatementFieldKey, string>> = {
  es: { offer: "qué vendes", who: "quién", problem: "problema", where: "dónde", why: "por qué tú" },
  en: { offer: "what you sell", who: "who", problem: "problem", where: "where", why: "why you" },
};

/**
 * Collapse whitespace, cap the length, then drop leading/trailing punctuation — the template adds
 * its own, so an answer like "pasteles.," can never produce ".." or ",." in the sentence.
 */
export function cleanStatementAnswer(raw: string | undefined | null): string {
  return (raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_STATEMENT_ANSWER_LENGTH)
    .replace(/^[\s.,;:]+/u, "")
    .replace(/[\s.。,;:!?¡¿]+$/u, "");
}

function isFieldKey(v: string): v is CustomerStatementFieldKey {
  return (CUSTOMER_STATEMENT_FIELD_KEYS as readonly string[]).includes(v);
}

export function buildCustomerStatement(
  answers: CustomerStatementAnswers,
  lang: LessonLang,
): { parts: StatementPart[]; text: string; filledCount: number; complete: boolean } {
  const parts: StatementPart[] = [];
  let filledCount = 0;
  for (const piece of TEMPLATE[lang]) {
    if (!isFieldKey(piece)) {
      parts.push({ kind: "text", text: piece });
      continue;
    }
    const answer = cleanStatementAnswer(answers[piece]);
    if (answer) {
      filledCount += 1;
      parts.push({ kind: "answer", text: answer, fieldKey: piece });
    } else {
      parts.push({ kind: "blank", text: `[${STATEMENT_BLANK_LABELS[lang][piece]}]`, fieldKey: piece });
    }
  }
  return {
    parts,
    text: parts.map((p) => p.text).join(""),
    filledCount,
    complete: filledCount === CUSTOMER_STATEMENT_FIELD_KEYS.length,
  };
}
