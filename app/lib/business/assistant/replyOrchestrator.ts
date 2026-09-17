/**
 * Program 7, Gate 7F — Assistant reply generation orchestrator.
 * Assembles bounded business context, calls the provider, fails closed if unavailable,
 * validates structured output, and persists both the user message and assistant reply
 * as append-only messages. Never mutates any other Program's state.
 */
import "server-only";

import { getDefaultAssistantProvider } from "./providerRegistry";
import { assembleContext } from "./contextAssembler";
import { appendMessage, appendSystemMessage } from "./repository";
import type { AssistantActor, AssistantContextType, AssistantActionBoundary } from "./types";

export type GenerateReplyResult =
  | { ok: true; replyText: string; suggestedActionBoundary: string | null }
  | { ok: false; failureCode: "provider_unavailable" | "invalid_provider_output" | "provider_failed"; failureReason: string };

function summarizeContext(snapshot: Record<string, unknown>): string {
  return JSON.stringify(snapshot);
}

export async function generateAssistantReply(
  businessId: string,
  threadId: string,
  contextType: AssistantContextType,
  userMessage: string,
  actor: AssistantActor,
): Promise<GenerateReplyResult> {
  await appendMessage(
    businessId,
    threadId,
    {
      role: "user",
      content: userMessage,
      contextType,
      visibility: "owner_and_staff",
    },
    actor,
  );

  const provider = await getDefaultAssistantProvider();
  const configured = await provider.isConfigured();
  if (!configured) {
    return { ok: false, failureCode: "provider_unavailable", failureReason: "Assistant provider is not configured on the server." };
  }

  const context = await assembleContext(businessId, contextType);
  const contextSummary = summarizeContext(context.snapshot);

  const response = await provider.respond(userMessage, contextSummary);
  if (!response.ok) {
    return response;
  }

  await appendSystemMessage(businessId, threadId, {
    content: response.replyText,
    contextType,
    actionBoundary: response.suggestedActionBoundary as AssistantActionBoundary | null,
    visibility: "owner_and_staff",
  });

  return { ok: true, replyText: response.replyText, suggestedActionBoundary: response.suggestedActionBoundary };
}
