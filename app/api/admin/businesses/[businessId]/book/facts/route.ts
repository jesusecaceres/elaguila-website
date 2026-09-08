import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { FACT_CATEGORIES, CONFIDENCE_LEVELS, FACT_VISIBILITIES, FACT_SENSITIVITIES, SOURCE_CLASSES } from "@/app/lib/business/livingBook/constants";
import { requiresManagerReviewToOverwrite } from "@/app/lib/business/livingBook/logic";
import { getFactHistory, upsertFact } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

const CATEGORY_VALUES = new Set<string>(FACT_CATEGORIES.map((o) => o.value));
const CONFIDENCE_VALUES = new Set<string>(CONFIDENCE_LEVELS.map((o) => o.value));
const VISIBILITY_VALUES = new Set<string>(FACT_VISIBILITIES.map((o) => o.value));
const SENSITIVITY_VALUES = new Set<string>(FACT_SENSITIVITIES.map((o) => o.value));
const SOURCE_CLASS_VALUES = new Set<string>(SOURCE_CLASSES.map((o) => o.value));

/** POST — create or (if an active fact with this key exists) supersede a business fact. */
export async function POST(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "create_business_fact")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const factKey = typeof b.factKey === "string" ? b.factKey.trim() : "";
  if (!factKey) return NextResponse.json({ ok: false, error: "empty_fact_key" }, { status: 400 });
  const factCategory = typeof b.factCategory === "string" && CATEGORY_VALUES.has(b.factCategory) ? b.factCategory : null;
  if (!factCategory) return NextResponse.json({ ok: false, error: "invalid_fact_category" }, { status: 400 });
  const sourceClass = typeof b.sourceClass === "string" && SOURCE_CLASS_VALUES.has(b.sourceClass) ? b.sourceClass : null;
  if (!sourceClass) return NextResponse.json({ ok: false, error: "invalid_source_class" }, { status: 400 });
  if (b.value === undefined) return NextResponse.json({ ok: false, error: "missing_value" }, { status: 400 });

  const confidence = typeof b.confidence === "string" && CONFIDENCE_VALUES.has(b.confidence) ? b.confidence : "medium";
  const visibility = typeof b.visibility === "string" && VISIBILITY_VALUES.has(b.visibility) ? b.visibility : "staff_only";
  const sensitivity = typeof b.sensitivity === "string" && SENSITIVITY_VALUES.has(b.sensitivity) ? b.sensitivity : "standard";
  const displayValue = typeof b.displayValue === "string" && b.displayValue.trim() ? b.displayValue.trim() : null;
  const effectiveDate = typeof b.effectiveDate === "string" && b.effectiveDate.trim() ? b.effectiveDate : null;

  // A sales_rep may propose facts but never silently overwrite an already-trusted sensitive fact —
  // confirm_business_fact (manager+) is required to push a new value through in that case.
  const existingHistory = await getFactHistory(businessId, factKey);
  const currentActive = existingHistory.find((f) => f.status === "active") ?? null;
  if (requiresManagerReviewToOverwrite(currentActive) && !actorHasCapability(access.actor, "confirm_business_fact")) {
    return NextResponse.json({ ok: false, error: "manager_review_required" }, { status: 403 });
  }

  const result = await upsertFact(
    {
      businessId,
      factKey,
      factCategory: factCategory as never,
      value: b.value,
      displayValue,
      sourceClass: sourceClass as never,
      confidence: confidence as never,
      visibility: visibility as never,
      sensitivity: sensitivity as never,
      effectiveDate,
    },
    staffActorToLivingBookActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id, superseded: result.superseded }, { status: 201 });
}
