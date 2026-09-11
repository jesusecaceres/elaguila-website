"use client";

import { useRef, useState } from "react";
import { uploadServiciosCredentialDocument } from "../lib/serviciosDraftPublishPrepare";

/** Uploads land in the Servicios draft-media folder of Leonix Blob storage (see draft-media-upload). */
function isLeonixUploadedDocumentUrl(url: string): boolean {
  return /^https:\/\/[^/]+\.blob\.vercel-storage\.com\/clasificados\/servicios\/drafts\//i.test(url.trim());
}

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

type UploadState =
  | { kind: "idle" }
  | { kind: "selected"; fileName: string }
  | { kind: "error"; message: string };

/**
 * Servicios Owner QA (SVC-QA-03 / SVC-QA-04) — license / insurance document: the existing external
 * URL field PLUS an upload option. Both write the same `licenseDocumentUrl` / `insuranceDocumentUrl`
 * value, so the public credential card keeps its single "Ver documento" CTA position and safe
 * new-tab opening (no second credential display system).
 *
 * Status is truthful: "Subiendo…" while the file is in flight, "Documento subido y guardado" ONLY
 * once the server returned the durable HTTPS URL, and the real reason on failure (the URL field is
 * left untouched when an upload fails).
 */
export function ServiciosCredentialDocumentField({
  label,
  help,
  value,
  onChange,
  slot,
  lang,
  inputClass,
  labelClass,
  maxLength,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (next: string) => void;
  slot: "licenseDoc" | "insuranceDoc";
  lang: "es" | "en";
  inputClass: string;
  labelClass: string;
  maxLength: number;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const uploaded = isLeonixUploadedDocumentUrl(value);

  const t =
    lang === "en"
      ? {
          or: "Or upload the document (PDF, JPG, PNG or WebP · max 4 MB)",
          choose: "Upload document",
          replace: "Replace document",
          uploading: "Uploading…",
          uploaded: "Document uploaded and saved",
          view: "View",
          remove: "Remove",
          errorSize: "That file is too large (max 4 MB).",
          errorType: "Use a PDF, JPG, PNG or WebP file.",
          errorGeneric: "The document could not be uploaded. Try again or paste a link instead.",
        }
      : {
          or: "O sube el documento (PDF, JPG, PNG o WebP · máx. 4 MB)",
          choose: "Subir documento",
          replace: "Reemplazar documento",
          uploading: "Subiendo…",
          uploaded: "Documento subido y guardado",
          view: "Ver",
          remove: "Quitar",
          errorSize: "El archivo es demasiado grande (máx. 4 MB).",
          errorType: "Usa un archivo PDF, JPG, PNG o WebP.",
          errorGeneric: "No se pudo subir el documento. Intenta de nuevo o pega un enlace.",
        };

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes((file.type || "").toLowerCase())) {
      setUpload({ kind: "error", message: t.errorType });
      return;
    }
    setUpload({ kind: "selected", fileName: file.name });
    setBusy(true);
    try {
      const url = await uploadServiciosCredentialDocument(file, slot);
      onChange(url.slice(0, maxLength));
      setUpload({ kind: "idle" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setUpload({
        kind: "error",
        message: /too_large|payload_too_large/i.test(msg) ? t.errorSize : /unsupported_type/i.test(msg) ? t.errorType : t.errorGeneric,
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div data-servicios-credential-document={slot}>
      <label className={labelClass}>{label}</label>
      <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{help}</p>
      <input
        className={inputClass}
        type="url"
        placeholder="https://"
        maxLength={maxLength}
        value={uploaded ? "" : value}
        disabled={busy}
        onChange={(e) => {
          setUpload({ kind: "idle" });
          onChange(e.target.value.slice(0, maxLength));
        }}
      />
      <p className="mt-2 text-xs text-[#6b5c42]">{t.or}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          id={`servicios-${slot}-file`}
          onChange={(e) => void onPick(e.target.files?.[0])}
          disabled={busy}
        />
        <label
          htmlFor={`servicios-${slot}-file`}
          className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border border-[#D8C79A] bg-white px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFFCF2] ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          {uploaded ? t.replace : t.choose}
        </label>
        {busy ? (
          <span role="status" aria-live="polite" className="text-xs font-semibold text-[#6b5c42]">
            {t.uploading} {upload.kind === "selected" ? `(${upload.fileName})` : ""}
          </span>
        ) : null}
        {!busy && uploaded ? (
          <span className="inline-flex flex-wrap items-center gap-2" data-servicios-credential-document-state="uploaded">
            <span role="status" className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span aria-hidden="true">✓</span>
              {t.uploaded}
            </span>
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#3B66AD] underline underline-offset-2">
              {t.view}
            </a>
            <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-red-700 underline underline-offset-2">
              {t.remove}
            </button>
          </span>
        ) : null}
        {!busy && upload.kind === "error" ? (
          <span role="alert" className="text-xs font-semibold text-red-800">
            {upload.message}
          </span>
        ) : null}
      </div>
    </div>
  );
}
