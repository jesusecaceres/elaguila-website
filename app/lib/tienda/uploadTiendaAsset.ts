import type { TiendaOrderSource } from "@/app/tienda/types/orderHandoff";
import type { TiendaAssetRole, TiendaOrderAssetReference } from "@/app/tienda/types/tiendaStoredAssets";

export type UploadTiendaAssetInput = {
  orderId: string;
  role: TiendaAssetRole;
  source: TiendaOrderSource;
  productSlug: string;
  file: Blob;
  mimeType: string;
  originalFilename: string;
  widthPx?: number | null;
  heightPx?: number | null;
};

export type UploadTiendaAssetResult =
  | { ok: true; reference: TiendaOrderAssetReference }
  | { ok: false; error: string; code?: string };

export async function uploadTiendaAsset(input: UploadTiendaAssetInput): Promise<UploadTiendaAssetResult> {
  const fd = new FormData();
  fd.set("orderId", input.orderId);
  fd.set("role", input.role);
  fd.set("source", input.source);
  fd.set("productSlug", input.productSlug);
  fd.set("mimeType", input.mimeType);
  fd.set("originalFilename", input.originalFilename);
  if (input.widthPx != null && Number.isFinite(input.widthPx)) {
    fd.set("widthPx", String(input.widthPx));
  }
  if (input.heightPx != null && Number.isFinite(input.heightPx)) {
    fd.set("heightPx", String(input.heightPx));
  }
  fd.set("file", input.file, input.originalFilename);

  const res = await fetch("/api/tienda/assets/upload", { method: "POST", body: fd });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Invalid upload response", code: "BAD_RESPONSE" };
  }
  const d = data as { ok?: boolean; error?: string; code?: string; reference?: TiendaOrderAssetReference };
  if (!res.ok || !d.ok || !d.reference) {
    return { ok: false, error: d.error ?? "Upload failed", code: d.code };
  }
  return { ok: true, reference: d.reference };
}
