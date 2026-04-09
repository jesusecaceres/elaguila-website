import { NextResponse } from "next/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  isAutosClassifiedsDbConfigured,
  markAutosClassifiedsListingRemovedIfOwner,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Take a live Autos listing off public surfaces (owner only). */
export async function POST(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await markAutosClassifiedsListingRemovedIfOwner(id, userId);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found_or_not_active" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
