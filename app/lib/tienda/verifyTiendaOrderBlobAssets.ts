import type { TiendaOrderSource } from "@/app/tienda/types/orderHandoff";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";
import type { TiendaAssetRole, TiendaOrderAssetReference } from "@/app/tienda/types/tiendaStoredAssets";
import { list } from "@vercel/blob";
import { inferTiendaAssetRoleFromPathname } from "./inferTiendaAssetRole";
import { tiendaOrderBlobPrefix } from "./tiendaBlobPrefix";

export type ListResult =
  | { ok: true; references: TiendaOrderAssetReference[] }
  | { ok: false; error: string; code: "LIST_FAILED" | "ASSETS_MISSING" | "BLOB_NOT_CONFIGURED" };

function extToMime(ext: string): string {
  const e = ext.toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".webp") return "image/webp";
  if (e === ".pdf") return "application/pdf";
  if (e === ".json") return "application/json";
  return "application/octet-stream";
}

function segmentOriginalName(pathname: string, role: TiendaAssetRole): string {
  const seg = pathname.split("/").pop() ?? "";
  if (role === "business-card-front") return "business-card-front.png";
  if (role === "business-card-back") return "business-card-back.png";
  if (role === "design-json-snapshot") return "design-json-snapshot.json";
  const prefix = role === "upload-front" ? "upload-front" : "upload-back";
  if (seg.startsWith(`${prefix}__`)) return seg.slice(prefix.length + 2) || seg;
  return seg;
}

export async function listDurableAssetsForOrder(
  orderId: string,
  source: TiendaOrderSource,
  productSlug: string
): Promise<ListResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token?.trim()) {
    return { ok: false, error: "Blob storage is not configured", code: "BLOB_NOT_CONFIGURED" };
  }

  try {
    const { blobs } = await list({
      prefix: `${tiendaOrderBlobPrefix(orderId)}/`,
      token,
    });

    const references: TiendaOrderAssetReference[] = [];

    for (const b of blobs) {
      const role = inferTiendaAssetRoleFromPathname(b.pathname);
      if (!role) continue;
      const extMatch = /\.[^.]+$/.exec(b.pathname);
      const mimeType = extMatch ? extToMime(extMatch[0]) : "application/octet-stream";
      references.push({
        role,
        orderId,
        source,
        productSlug,
        originalFilename: segmentOriginalName(b.pathname, role),
        mimeType,
        sizeBytes: b.size,
        widthPx: null,
        heightPx: null,
        storagePath: b.pathname,
        publicUrl: b.url,
        createdAtIso: b.uploadedAt.toISOString(),
      });
    }

    return { ok: true, references };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Blob list failed";
    return { ok: false, error: msg, code: "LIST_FAILED" };
  }
}

function hasRole(refs: TiendaOrderAssetReference[], role: TiendaAssetRole): boolean {
  return refs.some((r) => r.role === role);
}

export function assertRequiredDurableAssets(payload: TiendaOrderSubmissionPayload, refs: TiendaOrderAssetReference[]): ListResult {
  if (payload.source === "business-cards") {
    if (!hasRole(refs, "business-card-front")) {
      return { ok: false, error: "Missing durable business-card-front asset", code: "ASSETS_MISSING" };
    }
    if (payload.businessCardExtra?.sidedness === "two-sided" && !hasRole(refs, "business-card-back")) {
      return { ok: false, error: "Missing durable business-card-back asset for two-sided order", code: "ASSETS_MISSING" };
    }
    if (!hasRole(refs, "design-json-snapshot")) {
      return {
        ok: false,
        error: "Missing design-json-snapshot (builder state) — upload step incomplete",
        code: "ASSETS_MISSING",
      };
    }
    return { ok: true, references: refs };
  }

  if (!hasRole(refs, "upload-front")) {
    return { ok: false, error: "Missing durable upload-front file", code: "ASSETS_MISSING" };
  }
  if (payload.printUploadExtra?.back && !hasRole(refs, "upload-back")) {
    return { ok: false, error: "Missing durable upload-back file", code: "ASSETS_MISSING" };
  }

  return { ok: true, references: refs };
}
