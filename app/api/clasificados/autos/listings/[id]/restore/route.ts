import { NextResponse } from "next/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  isAutosClassifiedsDbConfigured,
  markAutosClassifiedsListingRestoredIfOwner,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * Globalization Package A Gate 5 — restore an owner-unpublished Autos listing to public
 * surfaces (owner only; strictly "removed" → "active", never admin-suspended rows). Mirror of
 * the existing unpublish route.
 */
export async function POST(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await markAutosClassifiedsListingRestoredIfOwner(id, userId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found_or_not_removed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
