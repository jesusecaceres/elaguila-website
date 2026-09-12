/**
 * Client Discovery & Project Blueprint Engine, Gate 4 — Website Architecture Review approval
 * (MD <architecture_review_ui>, <modify_decision>). This is the ONLY route that ever turns a
 * deterministic recommendation into an approved TECHNICAL_DECISION — gated on
 * review_project_discovery (the same capability Gate 1 already withholds from sales_rep), never
 * on the broader create/manage capability that only lets staff CAPTURE what a client said.
 *
 * This route never provisions any vendor account (MD <security>): no Vercel/Cloudflare/Sanity/
 * Supabase/Resend API call, no DNS mutation, no invite. It only computes a recommendation and
 * persists a staff decision about it.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { buildWebsiteDiscoveryContext } from "@/app/lib/business/projectDiscovery/websiteDiscoveryContext";
import { detectWebsiteScopeSignals } from "@/app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { buildArchitectureDecisionPacket, validatePlatformKeyOrOther, type ArchitectureOverride, type WebsiteArchitectureClass } from "@/app/lib/business/projectDiscovery/architectureDecisionEngine";
import { persistApprovedArchitectureDecision } from "@/app/lib/business/projectDiscovery/architectureApproval";
import { OTHER_EXTERNAL_PLATFORM_KEY } from "@/app/lib/business/projectDiscovery/platformRegistry";

export const runtime = "nodejs";

const VALID_CLASSES: readonly WebsiteArchitectureClass[] = ["RAPID_BUSINESS_SITE", "BUSINESS_SITE", "CUSTOM_PLATFORM", "PRESERVE_EXISTING_PLATFORM"];

interface OverrideBody {
  architectureClass?: unknown;
  preserveExistingPlatformKey?: unknown;
  otherExplanation?: unknown;
  reasonEs?: unknown;
  reasonEn?: unknown;
}

interface ApproveArchitectureBody {
  intentId?: unknown;
  override?: OverrideBody;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["review_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as ApproveArchitectureBody;

  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  if (!intentId) return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });

  let override: ArchitectureOverride | undefined;
  if (body.override) {
    const o = body.override;
    const architectureClass = typeof o.architectureClass === "string" ? o.architectureClass : "";
    const reasonEs = typeof o.reasonEs === "string" ? o.reasonEs.trim() : "";
    const reasonEn = typeof o.reasonEn === "string" ? o.reasonEn.trim() : "";
    if (!VALID_CLASSES.includes(architectureClass as WebsiteArchitectureClass) || !reasonEs || !reasonEn) {
      return NextResponse.json({ ok: false, error: "invalid_override" }, { status: 400 });
    }
    let preserveExistingPlatformKey: string | null = null;
    if (architectureClass === "PRESERVE_EXISTING_PLATFORM") {
      const key = typeof o.preserveExistingPlatformKey === "string" ? o.preserveExistingPlatformKey : "";
      const otherExplanation = typeof o.otherExplanation === "string" ? o.otherExplanation.trim() : null;
      if (!key || !validatePlatformKeyOrOther(key, otherExplanation)) {
        return NextResponse.json({ ok: false, error: "invalid_platform_key" }, { status: 400 });
      }
      preserveExistingPlatformKey = key === OTHER_EXTERNAL_PLATFORM_KEY ? `${OTHER_EXTERNAL_PLATFORM_KEY}: ${otherExplanation}` : key;
    }
    override = { architectureClass: architectureClass as WebsiteArchitectureClass, preserveExistingPlatformKey, reasonEs, reasonEn };
  }

  const ctx = await buildWebsiteDiscoveryContext(businessId, discoveryId, intentId);
  if (!ctx) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const scopeSignals = detectWebsiteScopeSignals(ctx);
  const packet = buildArchitectureDecisionPacket(ctx, scopeSignals, override);

  const result = await persistApprovedArchitectureDecision(businessId, discoveryId, intentId, packet, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });

  return NextResponse.json({ ok: true, packet });
}
