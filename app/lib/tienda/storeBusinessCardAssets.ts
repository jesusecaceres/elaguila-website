"use client";

import { toBlob } from "html-to-image";
import type { BusinessCardDocument } from "@/app/tienda/product-configurators/business-cards/types";
import { uploadTiendaAsset } from "@/app/lib/tienda/uploadTiendaAsset";

export type StoreBusinessCardAssetsResult =
  | { ok: true }
  | { ok: false; error: string; code?: string };

function waitNextFrames(n = 2): Promise<void> {
  return new Promise((resolve) => {
    let left = n;
    function tick() {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Uploads builder JSON + PNG visual exports from live DOM nodes (not print-perfect PDF).
 */
export async function storeBusinessCardAssets(input: {
  orderId: string;
  productSlug: string;
  document: BusinessCardDocument;
  /** Raw session JSON persisted in sessionStorage (V2). */
  sessionJson: unknown;
  /** Roots must match `[data-tienda-bc-export-root]` from `BusinessCardPreview`. */
  getExportRoot: (side: "front" | "back") => HTMLElement | null;
  /** Optional: wait for fonts/layout after mounting hidden previews. */
  waitForLayout?: () => Promise<void>;
}): Promise<StoreBusinessCardAssetsResult> {
  const { orderId, productSlug, document: doc, sessionJson, getExportRoot, waitForLayout } = input;

  const jsonBlob = new Blob([JSON.stringify(sessionJson)], { type: "application/json" });
  let step = await uploadTiendaAsset({
    orderId,
    role: "design-json-snapshot",
    source: "business-cards",
    productSlug,
    file: jsonBlob,
    mimeType: "application/json",
    originalFilename: "design-json-snapshot.json",
  });
  if (!step.ok) return step;

  if (waitForLayout) {
    await waitForLayout();
  } else {
    await waitNextFrames(2);
  }

  const frontEl = getExportRoot("front");
  if (!frontEl) {
    return { ok: false, error: "Could not render business card front for export.", code: "EXPORT_DOM_MISSING" };
  }

  let png: Blob | null;
  try {
    png = await toBlob(frontEl, { pixelRatio: 2, cacheBust: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PNG export failed";
    return { ok: false, error: msg, code: "EXPORT_FAILED" };
  }
  if (!png || png.size < 32) {
    return { ok: false, error: "Front PNG export was empty.", code: "EXPORT_FAILED" };
  }

  step = await uploadTiendaAsset({
    orderId,
    role: "business-card-front",
    source: "business-cards",
    productSlug,
    file: png,
    mimeType: "image/png",
    originalFilename: "business-card-front.png",
  });
  if (!step.ok) return step;

  if (doc.sidedness === "two-sided") {
    const backEl = getExportRoot("back");
    if (!backEl) {
      return { ok: false, error: "Could not render business card back for export.", code: "EXPORT_DOM_MISSING" };
    }
    try {
      png = await toBlob(backEl, { pixelRatio: 2, cacheBust: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PNG export failed";
      return { ok: false, error: msg, code: "EXPORT_FAILED" };
    }
    if (!png || png.size < 32) {
      return { ok: false, error: "Back PNG export was empty.", code: "EXPORT_FAILED" };
    }
    step = await uploadTiendaAsset({
      orderId,
      role: "business-card-back",
      source: "business-cards",
      productSlug,
      file: png,
      mimeType: "image/png",
      originalFilename: "business-card-back.png",
    });
    if (!step.ok) return step;
  }

  return { ok: true };
}
