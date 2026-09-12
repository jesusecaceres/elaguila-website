/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — answer capture (MD <answer_capture>,
 * <client_preference_capture>). One route backs every value type the small reusable renderer
 * supports (text/textarea/yes-no/choice/date/url/list/number/asset-ref) — never a bespoke route
 * per requirement.
 *
 * Section/value-type/completeness-class are derived from Gate 2's own catalog when the field key
 * is a known catalog requirement (never re-decided here — that would be reimplementing the
 * engine); a caller may only supply those for a genuinely custom, non-catalog field. truthClass is
 * always supplied explicitly by the caller — captureProjectDiscoveryItem() never defaults it,
 * matching Gate 1's own "never silently collapsed" doctrine. Capturing a value here NEVER sets
 * confirmationState — that stays a separate, review-gated action (see items/[itemId]/confirm).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { captureProjectDiscoveryItem } from "@/app/lib/business/projectDiscovery/repository";
import { getWebsiteRequirement } from "@/app/lib/business/projectDiscovery/websiteDiscoveryCatalog";
import type { DiscoveryCompletenessClass, DiscoveryItemValueType, DiscoveryTruthClass } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

const VALID_TRUTH_CLASSES: readonly DiscoveryTruthClass[] = [
  "client_confirmed", "public_verified", "staff_observation", "ai_extracted",
  "needs_confirmation", "unknown", "client_preference", "leonix_recommendation", "technical_decision",
];
const VALID_COMPLETENESS_CLASSES: readonly DiscoveryCompletenessClass[] = [
  "required_before_build", "required_before_launch", "helpful", "optional", "not_applicable", "needs_leonix_decision", "needs_official_research",
];
const VALID_VALUE_TYPES: readonly DiscoveryItemValueType[] = ["text", "number", "boolean", "date", "url", "list", "asset_ref", "choice", "other"];

interface CaptureItemBody {
  projectIntentId?: unknown;
  fieldKey?: unknown;
  value?: unknown;
  displayValue?: unknown;
  notes?: unknown;
  truthClass?: unknown;
  section?: unknown;
  completenessClass?: unknown;
  valueType?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["create_project_discovery", "manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as CaptureItemBody;

  const fieldKey = typeof body.fieldKey === "string" ? body.fieldKey.trim() : "";
  const truthClass = typeof body.truthClass === "string" ? body.truthClass : "";
  if (!fieldKey || !VALID_TRUTH_CLASSES.includes(truthClass as DiscoveryTruthClass)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const catalogRequirement = getWebsiteRequirement(fieldKey);
  const section = catalogRequirement?.section ?? (typeof body.section === "string" ? body.section : "custom");
  const completenessClass = catalogRequirement?.defaultCompletenessClass ?? (VALID_COMPLETENESS_CLASSES.includes(body.completenessClass as DiscoveryCompletenessClass) ? (body.completenessClass as DiscoveryCompletenessClass) : "helpful");
  const valueType = catalogRequirement?.valueType ?? (VALID_VALUE_TYPES.includes(body.valueType as DiscoveryItemValueType) ? (body.valueType as DiscoveryItemValueType) : "text");

  const result = await captureProjectDiscoveryItem(
    {
      discoveryId,
      businessId,
      projectIntentId: typeof body.projectIntentId === "string" ? body.projectIntentId : null,
      section,
      fieldKey,
      value: body.value ?? null,
      displayValue: typeof body.displayValue === "string" ? body.displayValue : null,
      valueType,
      truthClass: truthClass as DiscoveryTruthClass,
      completenessClass,
      notes: typeof body.notes === "string" ? body.notes : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, item: result.item });
}
