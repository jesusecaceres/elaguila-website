import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listBusinessesForWorkspace } from "@/app/admin/_lib/businessWorkspaceData";
import type { BusinessSalesStatus } from "@/app/admin/_lib/salesWorkspaceLogic";

export const dynamic = "force-dynamic";

const BOOL_PARAM = new Set(["true", "false"]);
function parseBoolParam(v: string | null): boolean | undefined {
  if (v === null || !BOOL_PARAM.has(v)) return undefined;
  return v === "true";
}

export async function GET(req: Request) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_list")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const { items, total } = await listBusinessesForWorkspace({
    keyword: sp.get("q") ?? undefined,
    broadBusinessType: sp.get("category") ?? undefined,
    businessStage: sp.get("stage") ?? undefined,
    country: sp.get("country") ?? undefined,
    status: (sp.get("status") as BusinessSalesStatus | null) ?? undefined,
    hasPhone: parseBoolParam(sp.get("hasPhone")),
    hasEmail: parseBoolParam(sp.get("hasEmail")),
    hasWhatsapp: parseBoolParam(sp.get("hasWhatsapp")),
    hasWebsite: parseBoolParam(sp.get("hasWebsite")),
    hasConnectedAds: parseBoolParam(sp.get("hasAds")),
    limit: Number(sp.get("limit") ?? "50") || 50,
    offset: Number(sp.get("offset") ?? "0") || 0,
  });

  return NextResponse.json({ ok: true, items, total });
}
