import { NextResponse, type NextRequest } from "next/server";
import { deleteOwnDraft, getOwnDraftById } from "@/app/lib/business/services/draftService";
import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/dashboard/business/drafts/[id] — RLS scopes this to the caller's own draft. */
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const userClient = getServerSupabaseForBearerToken(token);
  const draft = await getOwnDraftById(userClient, id);
  if (!draft) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ draft });
}

/** DELETE /api/dashboard/business/drafts/[id] — RLS scopes this to the caller's own draft. */
export async function DELETE(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const userClient = getServerSupabaseForBearerToken(token);
  const ok = await deleteOwnDraft(userClient, id);
  if (!ok) return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
