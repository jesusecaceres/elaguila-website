import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { validatePdfUpload, sanitizeUploadFilename } from "@/app/lib/recursos/intake/pdfFileValidation";
import { sha256Hex, uploadPdfToPrivateStorage, storagePathFor, RECURSOS_SOURCE_DOCUMENTS_BUCKET } from "@/app/lib/recursos/intake/server/pdfStorage";
import { dbCreatePdfSourceDocument, dbFindSourceDocumentByHash, dbSetSourceDocumentStoragePath } from "@/app/lib/recursos/intake/server/sourceDocumentsDb";
import { processPdfIntake } from "@/app/lib/recursos/intake/pdfIntakeOrchestrator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireLeonixAdminPermission("can_manage_recursos");
  } catch {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const c = await cookies();
  const actorEmail = getAdminOperatorEmailFromCookies(c);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const file = formData.get("pdf");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const titleInput = String(formData.get("title") ?? "").trim();
  const sourceDate = String(formData.get("sourceDate") ?? "").trim() || null;
  const supersedesDocumentId = String(formData.get("supersedesDocumentId") ?? "").trim() || null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const validation = validatePdfUpload({ buffer, declaredMimeType: file.type, sizeBytes: buffer.byteLength });
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.reason }, { status: 400 });
  }

  const filename = sanitizeUploadFilename(file.name);
  const fileHash = sha256Hex(buffer);

  const duplicate = await dbFindSourceDocumentByHash(fileHash);
  if (duplicate) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      existingDocumentId: duplicate.id,
      message: `Este PDF ya fue subido antes como "${duplicate.title}" (${new Date(duplicate.createdAt).toLocaleDateString()}). No se creó un documento ni procesamiento duplicado.`,
    });
  }

  const title = titleInput || filename;
  const docResult = await dbCreatePdfSourceDocument({
    title,
    storageBucket: RECURSOS_SOURCE_DOCUMENTS_BUCKET,
    storagePath: "", // filled in immediately below once we know the generated document id
    fileSha256: fileHash,
    originalFilename: filename,
    mimeType: "application/pdf",
    fileSizeBytes: buffer.byteLength,
    sourceDate,
    supersedesDocumentId,
    createdBy: actorEmail,
  });
  if (!docResult.ok) {
    return NextResponse.json({ ok: false, error: `No se pudo registrar el documento: ${docResult.error}` }, { status: 500 });
  }

  const path = storagePathFor(docResult.id);
  const uploadResult = await uploadPdfToPrivateStorage(docResult.id, buffer);
  if (!uploadResult.ok) {
    return NextResponse.json({ ok: false, error: `No se pudo subir el archivo al almacenamiento privado: ${uploadResult.error}` }, { status: 500 });
  }

  // Storage path is only known after upload (it embeds the document's own generated id).
  await dbSetSourceDocumentStoragePath(docResult.id, path);

  const result = await processPdfIntake({ sourceDocumentId: docResult.id, documentTitle: title, buffer, actorEmail });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason, jobId: result.jobId || null }, { status: 200 });
  }

  return NextResponse.json({ ok: true, jobId: result.jobId, candidatesCreated: result.candidates.length, pagesProcessed: result.pagesProcessed });
}
