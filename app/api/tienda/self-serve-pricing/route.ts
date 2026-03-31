import { NextResponse } from "next/server";
import {
  buildSelfServeOrderPricingSnapshot,
  isSelfServeCatalogPricingProduct,
  type SelfServePricingMatchInput,
} from "@/app/lib/tienda/selfServePricing";
import { fetchCatalogItemAndRulesForSelfServeSlug } from "@/app/lib/tienda/selfServePricingFetch";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const productSlug = String(o.productSlug ?? "").trim();
  if (!productSlug || !isSelfServeCatalogPricingProduct(productSlug)) {
    return NextResponse.json({ error: "unsupported product" }, { status: 400 });
  }

  const quantity = Math.max(1, Math.min(1_000_000, Number(o.quantity) || 250));
  const input: SelfServePricingMatchInput = {
    productSlug,
    quantity,
    sidesKey: o.sidesKey != null ? String(o.sidesKey) : null,
    sizeKey: o.sizeKey != null ? String(o.sizeKey) : null,
    stockKey: o.stockKey != null ? String(o.stockKey) : null,
    finishKey: o.finishKey != null ? String(o.finishKey) : null,
  };

  const { item, rules, error } = await fetchCatalogItemAndRulesForSelfServeSlug(productSlug);
  if (error) {
    return NextResponse.json({
      snapshot: buildSelfServeOrderPricingSnapshot(null, [], input),
      fetchWarning: error,
    });
  }

  const snapshot = buildSelfServeOrderPricingSnapshot(item, rules, input);
  return NextResponse.json({ snapshot });
}
