import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { assertTiendaOrderId, tiendaOrderBlobPrefix } from "@/app/lib/tienda/tiendaBlobPrefix";
import type { TiendaOrderSource } from "@/app/tienda/types/orderHandoff";
import type { TiendaAssetRole } from "@/app/tienda/types/tiendaStoredAssets";
import { isRegisteredOrderHandoff } from "@/app/tienda/order/orderHandoffRegistry";

export const runtime = "nodejs";

const ROLES = [
  "business-card-front",
  "business-card-back",
  "upload-front",
  "upload-back",
  "design-json-snapshot",
] as const satisfies readonly TiendaAssetRole[];

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180) || "file";
}

function buildPathname(orderId: string, role: TiendaAssetRole, originalFilename: string): string {
  const base = tiendaOrderBlobPrefix(orderId);
  if (role === "business-card-front") return `${base}/business-card-front.png`;
  if (role === "business-card-back") return `${base}/business-card-back.png`;
  if (role === "design-json-snapshot") return `${base}/design-json-snapshot.json`;
  const safe = sanitizeFilename(originalFilename);
  if (role === "upload-front") return `${base}/upload-front__${safe}`;
  return `${base}/upload-back__${safe}`;
}

export async function POST(req: Request): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Blob storage is not configured", code: "BLOB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data", code: "BAD_FORM" }, { status: 400 });
  }

  const orderId = String(form.get("orderId") ?? "").trim();
  if (!assertTiendaOrderId(orderId)) {
    return NextResponse.json({ ok: false, error: "Invalid order id", code: "BAD_ORDER_ID" }, { status: 400 });
  }

  const roleRaw = String(form.get("role") ?? "").trim();
  if (!(ROLES as readonly string[]).includes(roleRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid asset role", code: "BAD_ROLE" }, { status: 400 });
  }
  const role = roleRaw as TiendaAssetRole;

  const productSlug = String(form.get("productSlug") ?? "").trim();
  const source = String(form.get("source") ?? "").trim() as TiendaOrderSource;
  if (!isRegisteredOrderHandoff(source, productSlug)) {
    return NextResponse.json({ ok: false, error: "Invalid product context", code: "INVALID_PRODUCT" }, { status: 400 });
  }

  const mimeType = String(form.get("mimeType") ?? "").trim().slice(0, 200);
  const originalFilename = String(form.get("originalFilename") ?? "").trim().slice(0, 400);
  const widthPxRaw = form.get("widthPx");
  const heightPxRaw = form.get("heightPx");
  const widthPx = widthPxRaw != null && widthPxRaw !== "" ? Number(widthPxRaw) : null;
  const heightPx = heightPxRaw != null && heightPxRaw !== "" ? Number(heightPxRaw) : null;

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "Missing file body", code: "MISSING_FILE" }, { status: 400 });
  }

  const pathname = buildPathname(orderId, role, originalFilename || "asset");

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: false,
    contentType: mimeType || undefined,
  });

  return NextResponse.json({
    ok: true,
    reference: {
      role,
      orderId,
      source,
      productSlug,
      originalFilename: originalFilename || (pathname.split("/").pop() ?? "file"),
      mimeType: mimeType || uploaded.contentType || "application/octet-stream",
      sizeBytes: file.size,
      widthPx: Number.isFinite(widthPx as number) ? widthPx : null,
      heightPx: Number.isFinite(heightPx as number) ? heightPx : null,
      storagePath: uploaded.pathname,
      publicUrl: uploaded.url,
      createdAtIso: new Date().toISOString(),
    },
  });
}
