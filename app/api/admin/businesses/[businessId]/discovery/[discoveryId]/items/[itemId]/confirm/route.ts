/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — item confirmation (MD <truth_ui>,
 * <confirmation>: "the smallest correct review control"). Gated on review_project_discovery,
 * which sales_rep deliberately lacks (see salesWorkspaceCapabilities.ts) — capturing what a client
 * said is not the same authority as formally confirming/rejecting it.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { setProjectDiscoveryItemConfirmation } from "@/app/lib/business/projectDiscovery/repository";

export const runtime = "nodejs";

const VALID_STATES = ["confirmed", "rejected", "unconfirmed"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; itemId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, itemId } = await params;
  const body = (await req.json().catch(() => ({}))) as { confirmationState?: unknown };
  if (typeof body.confirmationState !== "string" || !VALID_STATES.includes(body.confirmationState as (typeof VALID_STATES)[number])) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await setProjectDiscoveryItemConfirmation(businessId, itemId, body.confirmationState as (typeof VALID_STATES)[number], access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, item: result.item });
}
