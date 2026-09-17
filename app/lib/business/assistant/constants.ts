/**
 * Program 7 — Contextual Business Concierge Assistant constants.
 * The assistant is bounded to a specific business context.
 * It can READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, SUGGEST.
 * It may NOT autonomously update facts, resolve contradictions, approve recommendations,
 * charge, send messages, or mutate any business state.
 */

export const BUSINESS_CONTEXTUAL_ASSISTANT_FLAG_KEY = "business_contextual_assistant";

export const ASSISTANT_MESSAGE_ROLES: readonly string[] = [
  "user", "assistant",
];

export const ASSISTANT_ACTION_BOUNDARIES: readonly string[] = [
  "READ", "EXPLAIN", "SUMMARIZE", "GUIDE", "DRAFT", "SUGGEST",
];

export const ASSISTANT_CONTEXT_TYPES: readonly string[] = [
  "living_book", "health_map", "stewardship", "ai_research",
  "meeting_studio", "proposals", "promise_keeper", "creative_studio",
  "outcomes", "advisor", "general",
];

export const ASSISTANT_THREAD_STATUSES: readonly string[] = [
  "active", "archived",
];

export const ASSISTANT_MESSAGE_VISIBILITY: readonly string[] = [
  "owner_and_staff", "staff_only",
];
