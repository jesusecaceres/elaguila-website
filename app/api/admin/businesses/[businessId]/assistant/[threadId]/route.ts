/**
 * Program 7 — Admin API for assistant messages within a business-scoped thread.
 * businessId scopes the business. threadId identifies the conversation. They are not interchangeable.
 */
import { NextResponse } from "next/server";
import {
  actorHasCapability,
  denialStatusCode,
  requireSalesWorkspaceAccess,
  salesActorToAssistantActor,
} from "@/app/admin/_lib/businessWorkspaceAccess";
import { isAssistantEnabled } from "@/app/lib/business/assistant/featureFlag";
import { generateAssistantReply } from "@/app/lib/business/assistant/replyOrchestrator";
import { getThreadById, listMessagesForThread } from "@/app/lib/business/assistant/repository";
import type { AssistantContextType } from "@/app/lib/business/assistant/types";

function mapMessage(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    role: String(row.role ?? ""),
    content: String(row.content ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    contextType: String(row.contextType ?? row.context_type ?? ""),
    actionBoundary: (row.actionBoundary ?? row.action_boundary ?? null) as string | null,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string; threadId: string }> },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await isAssistantEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId, threadId } = await params;
  const thread = await getThreadById(businessId, threadId);
  if (!thread) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const raw = await listMessagesForThread(businessId, threadId);
  return NextResponse.json({ messages: (raw as unknown as Record<string, unknown>[]).map(mapMessage) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string; threadId: string }> },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await isAssistantEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId, threadId } = await params;
  const thread = await getThreadById(businessId, threadId);
  if (!thread) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "missing_content" }, { status: 400 });
  }

  const actor = salesActorToAssistantActor(access.actor);
  const contextType: AssistantContextType = thread.primaryContextType;
  const result = await generateAssistantReply(businessId, threadId, contextType, content, actor);

  const raw = await listMessagesForThread(businessId, threadId);
  const messages = (raw as unknown as Record<string, unknown>[]).map(mapMessage);

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      failureCode: result.failureCode,
      failureReason: result.failureReason,
      messages,
    }, { status: result.failureCode === "provider_unavailable" ? 503 : 400 });
  }

  return NextResponse.json({
    ok: true,
    replyText: result.replyText,
    suggestedActionBoundary: result.suggestedActionBoundary,
    messages,
  });
}
