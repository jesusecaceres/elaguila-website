/**
 * Program 7 — Contextual Business Concierge Assistant domain types.
 * The assistant is always scoped to a specific business + thread.
 * It never operates as a global blank chatbot disconnected from a business.
 * AI output is always draft/suggestion — never written directly to business_facts.
 */

export type AssistantMessageRole = "user" | "assistant";

export type AssistantActionBoundary =
  | "READ" | "EXPLAIN" | "SUMMARIZE" | "GUIDE" | "DRAFT" | "SUGGEST";

export type AssistantContextType =
  | "living_book" | "health_map" | "stewardship" | "ai_research"
  | "meeting_studio" | "proposals" | "promise_keeper" | "creative_studio"
  | "outcomes" | "advisor" | "general";

export type AssistantThreadStatus = "active" | "archived";

export type AssistantMessageVisibility = "owner_and_staff" | "staff_only";

export type AssistantActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type BusinessAssistantThread = {
  id: string;
  businessId: string;
  status: AssistantThreadStatus;
  titleEs: string | null;
  titleEn: string | null;
  primaryContextType: AssistantContextType;
  lastMessageAt: string | null;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessAssistantMessage = {
  id: string;
  businessId: string;
  threadId: string;
  role: AssistantMessageRole;
  content: string;
  contextType: AssistantContextType;
  actionBoundary: AssistantActionBoundary | null;
  visibility: AssistantMessageVisibility;
  sourceReferenceId: string | null;
  createdActorType: "staff" | "owner" | "system";
  createdByRosterId: string | null;
  createdByAuthUserId: string | null;
  createdByEmail: string | null;
  createdByRole: string;
  createdAt: string;
};
