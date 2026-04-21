import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { upsertEmpleosListingFromEnvelope } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBearerUserId } from "../../_lib/bearerUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const envelope = b.envelope as EmpleosPublishEnvelope | undefined;
  const mode = b.mode === "draft" ? "draft" : "publish";
  if (!envelope || typeof envelope !== "object") {
    return NextResponse.json({ ok: false, error: "missing_envelope" }, { status: 400 });
  }

  const res = await upsertEmpleosListingFromEnvelope({ envelope, ownerUserId, mode });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: res.error === "forbidden" ? 403 : 500 });
  }

  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath(`/clasificados/empleos/${res.slug}`);
  revalidatePath("/clasificados/empleos");
  revalidatePath("/dashboard/empleos");

  return NextResponse.json({
    ok: true,
    id: res.id,
    slug: res.slug,
    lifecycle_status: res.lifecycle_status,
  });
}
