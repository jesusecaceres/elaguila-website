/**
 * Program 7 — Admin API for listing and creating assistant threads.
 * Dynamic [businessId] repair of the encoded %5BbusinessId%5D folder.
 */
import { NextResponse } from "next/server";
import {
  actorHasCapability,
  denialStatusCode,
  requireSalesWorkspaceAccess,
  salesActorToAssistantActor,
} from "@/app/admin/_lib/businessWorkspaceAccess";
import { isAssistantEnabled } from "@/app/lib/business/assistant/featureFlag";
import { createThread, listThreadsForBusiness } from "@/app/lib/business/assistant/repository";
import type { AssistantContextType } from "@/app/lib/business/assistant/types";
import { ASSISTANT_CONTEXT_TYPES } from "@/app/lib/business/assistant/constants";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
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

  const { businessId } = await params;
  const threads = await listThreadsForBusiness(businessId);
  return NextResponse.json({ threads });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
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

  const { businessId } = await params;
  const body = await req.json().catch(() => null);
  const requestedType = body?.primaryContextType;
  const primaryContextType: AssistantContextType =
    typeof requestedType === "string" && (ASSISTANT_CONTEXT_TYPES as readonly string[]).includes(requestedType)
      ? (requestedType as AssistantContextType)
      : "general";

  const actor = salesActorToAssistantActor(access.actor);
  const thread = await createThread(businessId, { primaryContextType }, actor);
  if (!thread) {
    return NextResponse.json({ error: "mutation_failed" }, { status: 400 });
  }
  return NextResponse.json({ thread });
}
