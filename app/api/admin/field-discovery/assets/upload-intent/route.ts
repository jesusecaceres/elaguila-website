import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToFieldDiscoveryActor } from "@/app/admin/_lib/fieldDiscoveryActor";
import { createFieldDiscoveryStoragePath } from "@/app/lib/business/fieldDiscovery/storagePaths";
import { validateFieldDiscoveryUploadMeta } from "@/app/lib/business/fieldDiscovery/uploadValidation";
import { createSourceFile } from "@/app/lib/business/fieldDiscovery/repository";
import { SOURCE_FILE_KIND_VALUES } from "@/app/lib/business/fieldDiscovery/constants";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { SourceFileKind } from "@/app/lib/business/fieldDiscovery/types";

export const runtime = "nodejs";

function isSourceFileKind(v: string): v is SourceFileKind {
  return (SOURCE_FILE_KIND_VALUES as readonly string[]).includes(v);
}

async function businessExists(businessId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("businesses").select("id").eq("id", businessId).maybeSingle();
  return !error && !!data;
}

/**
 * Reserve an authorized Vercel Blob pathname before client-direct upload (files above the
 * server-form threshold). Validates MIME/size and exact-business authorization without
 * receiving the file body.
 */
export async function POST(req: NextRequest) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "upload_discovery_files")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const o = (body ?? {}) as Record<string, unknown>;
  const businessId = String(o.businessId ?? "").trim();
  const fileKindRaw = String(o.fileKind ?? "").trim().toLowerCase();
  const fileName = String(o.fileName ?? "upload.bin").trim() || "upload.bin";
  const mimeType = String(o.mimeType ?? "").trim().toLowerCase();
  const sizeBytes = typeof o.sizeBytes === "number" ? o.sizeBytes : Number(o.sizeBytes);

  if (!businessId || !isSourceFileKind(fileKindRaw) || !Number.isFinite(sizeBytes)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!(await businessExists(businessId))) {
    return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  }

  const validation = validateFieldDiscoveryUploadMeta({ mimeType, sizeBytes });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error, detail: validation.detail }, { status: 400 });
  }

  const pathname = createFieldDiscoveryStoragePath({ businessId, fileName, mimeType });
  if (!pathname) {
    return NextResponse.json({ ok: false, error: "unsupported_file_type", detail: "File extension is not allowed." }, { status: 400 });
  }

  const clientPayload = JSON.stringify({ businessId, fileKind: fileKindRaw, mimeType, sizeBytes });

  return NextResponse.json({ ok: true, pathname, clientPayload });
}

/**
 * Finalize metadata after a successful client-direct Vercel Blob upload. Never trusts a
 * client-supplied storage path outside the exact-business folder produced above.
 */
export async function PUT(req: NextRequest) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "upload_discovery_files")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const o = (body ?? {}) as Record<string, unknown>;
  const businessId = String(o.businessId ?? "").trim();
  const fileKindRaw = String(o.fileKind ?? "").trim().toLowerCase();
  const relatedDiscoverySessionId = typeof o.relatedDiscoverySessionId === "string" ? o.relatedDiscoverySessionId : null;
  const storagePath = String(o.storagePath ?? "").trim();
  const publicUrl = String(o.publicUrl ?? "").trim();
  const mimeType = String(o.mimeType ?? "").trim().toLowerCase();
  const originalFilename = String(o.originalFilename ?? "upload.bin").trim() || "upload.bin";
  const sizeBytes = typeof o.sizeBytes === "number" ? o.sizeBytes : Number(o.sizeBytes);

  if (!businessId || !isSourceFileKind(fileKindRaw) || !storagePath || !publicUrl || !Number.isFinite(sizeBytes)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const expectedFolder = `field-discovery/${businessId}/`;
  if (!storagePath.startsWith(expectedFolder)) {
    return NextResponse.json({ ok: false, error: "cross_business_forbidden" }, { status: 403 });
  }

  const result = await createSourceFile(
    { businessId, relatedDiscoverySessionId, fileKind: fileKindRaw, storagePath, publicUrl, mimeType, originalFilename, sizeBytes, consentRecordId: null },
    staffActorToFieldDiscoveryActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, id: result.id });
}
