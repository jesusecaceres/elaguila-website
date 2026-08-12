/**
 * Program 7 — Owner API route for assistant threads and messages.
 * Returns owner-safe threads and messages only. Never exposes staff-only messages.
 */
import { NextResponse } from "next/server";
import { resolveAssistantOwnerAccess } from "@/app/lib/business/assistant/ownerAccess";
import { listThreadsForBusiness, listOwnerSafeMessagesForThread } from "@/app/lib/business/assistant/repository";
import { shapeThreadForOwner, shapeMessageForOwner } from "@/app/lib/business/assistant/logic";

export async function GET(
  req: Request,
  { params }: { params: { businessId: string } },
) {
  const access = await resolveAssistantOwnerAccess(req, params.businessId ?? null);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const threads = await listThreadsForBusiness(access.business.id);
  const ownerSafeThreads = threads
    .filter((t) => t.status === "active")
    .map(shapeThreadForOwner);

  const threadsWithMessages = await Promise.all(
    ownerSafeThreads.map(async (thread) => {
      const messages = await listOwnerSafeMessagesForThread(access.business.id, thread.id);
      return {
        ...thread,
        messages: messages.map(shapeMessageForOwner),
      };
    }),
  );

  return NextResponse.json({ threads: threadsWithMessages });
}
