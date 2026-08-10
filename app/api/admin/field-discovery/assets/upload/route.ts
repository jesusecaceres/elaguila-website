import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess, denialStatusCode } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToFieldDiscoveryActor } from "@/app/admin/_lib/fieldDiscoveryActor";
import { FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES, SOURCE_FILE_KIND_VALUES } from "@/app/lib/business/fieldDiscovery/constants";
import { createSourceFile } from "@/app/lib/business/fieldDiscovery/repository";
import { createFieldDiscoveryStoragePath } from "@/app/lib/business/fieldDiscovery/storagePaths";
import { validateFieldDiscoveryUploadMeta } from "@/app/lib/business/fieldDiscovery/uploadValidation";
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

/** Upload one canvassing/discovery file to Vercel Blob (small files only — see upload-intent for larger files). */
export async function POST(req: NextRequest) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "upload_discovery_files")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "blob_unconfigured", detail: "BLOB_READ_WRITE_TOKEN is not set on the server." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const businessId = String(form.get("businessId") ?? "").trim();
  const fileKindRaw = String(form.get("fileKind") ?? "").trim().toLowerCase();
  const relatedDiscoverySessionId = form.get("relatedDiscoverySessionId") ? String(form.get("relatedDiscoverySessionId")) : null;

  if (!businessId || !isSourceFileKind(fileKindRaw)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!(await businessExists(businessId))) {
    return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "empty_file" }, { status: 400 });
  }
  if (file.size > FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "upload_too_large", detail: "Use the direct-upload path for larger files." }, { status: 413 });
  }

  const fileName = file instanceof File && file.name ? file.name : "upload.bin";
  const mimeType = (file.type || "").toLowerCase();

  const validation = validateFieldDiscoveryUploadMeta({ mimeType, sizeBytes: file.size });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error, detail: validation.detail }, { status: 400 });
  }

  const pathname = createFieldDiscoveryStoragePath({ businessId, fileName, mimeType });
  if (!pathname) {
    return NextResponse.json({ ok: false, error: "unsupported_file_type" }, { status: 400 });
  }

  const uploaded = await put(pathname, file, { access: "public", token, addRandomSuffix: false, contentType: mimeType || undefined });

  const result = await createSourceFile(
    {
      businessId,
      relatedDiscoverySessionId,
      fileKind: fileKindRaw,
      storagePath: uploaded.pathname ?? pathname,
      publicUrl: uploaded.url,
      mimeType,
      originalFilename: fileName,
      sizeBytes: file.size,
      consentRecordId: null,
    },
    staffActorToFieldDiscoveryActor(access.actor),
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, id: result.id, storagePath: uploaded.pathname ?? pathname, publicUrl: uploaded.url });
}
