/**
 * LEO-22QA.3 — Fallback class after deterministic retrieval does not apply.
 * GENERAL_REASONING_ALLOWED may use the existing AI runtime.
 * COMPANY_FACT_REQUIRES_EVIDENCE must not be invented.
 */

export const LEO_CONVERSATION_FALLBACK_CLASSES = [
  "GENERAL_REASONING_ALLOWED",
  "COMPANY_FACT_REQUIRES_EVIDENCE",
] as const;

export type LeoConversationFallbackClass = (typeof LEO_CONVERSATION_FALLBACK_CLASSES)[number];

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Live Leonix operational facts that must not be invented by general LLM fallback.
 */
export function isLeoCompanyFactQuestion(question: string): boolean {
  const n = normalize(question);
  if (!n) return false;
  if (
    /\b(current|live|right now|as of (now|today)|today's|todays)\b/.test(n) &&
    /\b(revenue|balance|stripe|inbox|pipeline|production|deploy|client status|cash)\b/.test(n)
  ) {
    return true;
  }
  if (/\bstripe balance\b|\bhow much (did we|have we|do we) (make|made|earn|take in)\b/.test(n)) {
    return true;
  }
  if (/\b(did|has)\b.+\b(reply|replied|respond|responded)\b/.test(n)) return true;
  if (/\b(who emailed me|unread (emails|mail)|did i get (an )?email)\b/.test(n)) return true;
  if (/\b(is production (up|down|live)|deployment status|is (the )?site down)\b/.test(n)) {
    return true;
  }
  if (/\bhow many (active )?clients\b|\bcurrent (staff|employees) (online|working)\b/.test(n)) {
    return true;
  }
  if (/\b(exact|current) (commitment|revenue|payout|invoice)\b/.test(n)) return true;
  return false;
}

export function classifyLeoConversationFallback(question: string): LeoConversationFallbackClass {
  if (isLeoCompanyFactQuestion(question)) return "COMPANY_FACT_REQUIRES_EVIDENCE";
  return "GENERAL_REASONING_ALLOWED";
}
