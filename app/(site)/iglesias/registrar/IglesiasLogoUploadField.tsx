"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  iglesiasLogoAcceptAttribute,
  iglesiasLogoUploadErrorMessage,
  parseIglesiasLogoUploadResponse,
  validateIglesiasLogoFile,
} from "@/app/lib/iglesias/logoUpload";

const DRAFT_SESSION_KEY = "leonix.iglesias.logoDraftSession";

function getDraftSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = sessionStorage.getItem(DRAFT_SESSION_KEY);
    if (!v) {
      v = `ig${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(DRAFT_SESSION_KEY, v);
    }
    return v;
  } catch {
    return `ig-fallback-${Date.now()}`;
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

export function IglesiasLogoUploadField({
  lang,
  logoUrl,
  onLogoUrlChange,
  fieldClass,
  labelClass,
}: {
  lang: "es" | "en";
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  fieldClass: string;
  labelClass: string;
}) {
  const inputId = useId();
  const urlFallbackPanelId = `${inputId}-url-fallback`;
  const errId = `${inputId}-err`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  useEffect(() => {
    return () => {
      if (previewSrc.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  function clearPreviewBlob() {
    if (previewSrc.startsWith("blob:")) URL.revokeObjectURL(previewSrc);
  }

  function removeLogo() {
    clearPreviewBlob();
    setPreviewSrc("");
    setFileName("");
    setError("");
    onLogoUrlChange("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFileSelected(file: File | null) {
    setError("");
    if (!file) return;

    const valid = validateIglesiasLogoFile(file, lang);
    if (!valid.ok) {
      setError(valid.message);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    clearPreviewBlob();
    const blobUrl = URL.createObjectURL(file);
    setPreviewSrc(blobUrl);
    setFileName(file.name);
    setUploading(true);

    try {
      const form = new FormData();
      form.set("draftSessionId", getDraftSessionId());
      form.set("file", file, file.name || "logo.jpg");

      const res = await fetch("/api/iglesias/logo-upload", { method: "POST", body: form });
      const raw = await res.text();
      const parsed = parseIglesiasLogoUploadResponse(res.status, res.headers.get("content-type"), raw);

      if (!parsed.ok) {
        setError(iglesiasLogoUploadErrorMessage(parsed.error, parsed.detail, lang));
        clearPreviewBlob();
        setPreviewSrc("");
        setFileName("");
        onLogoUrlChange("");
        return;
      }

      clearPreviewBlob();
      setPreviewSrc(parsed.publicUrl);
      onLogoUrlChange(parsed.publicUrl);
    } catch {
      setError(lang === "en" ? "Could not upload the logo. Try again." : "No pudimos subir el logo. Inténtalo de nuevo.");
      clearPreviewBlob();
      setPreviewSrc("");
      setFileName("");
      onLogoUrlChange("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function expandUrlFallback() {
    setShowUrlFallback(true);
    setUrlDraft((current) => {
      if (current.trim()) return current;
      if (fileName || !logoUrl.trim() || !isHttpsUrl(logoUrl)) return current;
      return logoUrl.trim();
    });
  }

  function collapseUrlFallback() {
    setShowUrlFallback(false);
  }

  function applyUrlFallback() {
    setError("");
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!isHttpsUrl(trimmed)) {
      setError(lang === "en" ? "Use a secure https:// link." : "Usa un enlace seguro https://.");
      return;
    }
    clearPreviewBlob();
    setPreviewSrc(trimmed);
    setFileName("");
    onLogoUrlChange(trimmed);
    setShowUrlFallback(false);
  }

  const label = lang === "en" ? "Church logo" : "Logo de la iglesia";
  const helper = lang === "en" ? "Upload your church's official logo." : "Sube el logo oficial de tu iglesia.";
  const uploadLabel = lang === "en" ? "Upload logo" : "Subir logo";
  const replaceLabel = lang === "en" ? "Replace logo" : "Reemplazar logo";
  const removeLabel = lang === "en" ? "Remove logo" : "Quitar logo";
  const urlToggle = lang === "en" ? "Use a link instead" : "Usar enlace en su lugar";
  const urlCollapse = lang === "en" ? "Hide link" : "Ocultar enlace";
  const addUrlLabel = lang === "en" ? "Use link" : "Usar enlace";

  return (
    <div className="sm:col-span-2">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <p className="mb-2 text-xs leading-relaxed text-[#5C5346]">{helper}</p>
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={iglesiasLogoAcceptAttribute()}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => void onFileSelected(e.target.files?.[0] ?? null)}
      />

      <div className="rounded-xl border border-[#D6C7AD]/80 bg-white p-3">
        <button
          type="button"
          disabled={uploading}
          aria-describedby={error ? errId : undefined}
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[11rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D6C7AD] bg-[#FFFCF7] px-4 py-6 text-center transition hover:border-[#7A1E2C]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {previewSrc ? (
            <div className="flex h-28 w-full max-w-[12rem] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={lang === "en" ? "Selected church logo preview" : "Vista previa del logo seleccionado"}
                className="max-h-28 max-w-full object-contain"
              />
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#7A1E2C]">{uploading ? (lang === "en" ? "Uploading…" : "Subiendo…") : uploadLabel}</span>
          )}
        </button>

        {fileName ? (
          <p className="mt-2 truncate text-xs text-[#5C5346]" title={fileName}>
            {fileName}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-3">
          {previewSrc ? (
            <>
              <button
                type="button"
                disabled={uploading}
                className="min-h-11 text-xs font-semibold text-[#7A1E2C] underline-offset-2 hover:underline disabled:opacity-60"
                onClick={() => fileRef.current?.click()}
              >
                {replaceLabel}
              </button>
              <button
                type="button"
                disabled={uploading}
                className="min-h-11 text-xs font-semibold text-[#7A1E2C] underline-offset-2 hover:underline disabled:opacity-60"
                onClick={removeLogo}
              >
                {removeLabel}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p id={errId} role="alert" className="mt-2 text-xs font-semibold text-[#7A1E2C]">
          {error}
        </p>
      ) : null}

      <div className="mt-2">
        {!showUrlFallback ? (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={urlFallbackPanelId}
            className="min-h-11 text-xs font-medium text-[#5C5346] underline-offset-2 hover:text-[#7A1E2C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C] focus-visible:ring-offset-2"
            onClick={expandUrlFallback}
          >
            {urlToggle}
          </button>
        ) : (
          <div id={urlFallbackPanelId} className="space-y-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                className={`${fieldClass} min-w-0 w-full sm:flex-1`}
                placeholder="https://"
                aria-label={lang === "en" ? "Logo image URL" : "URL del logo"}
              />
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C] focus-visible:ring-offset-2"
                onClick={applyUrlFallback}
              >
                {addUrlLabel}
              </button>
            </div>
            <button
              type="button"
              aria-expanded={true}
              aria-controls={urlFallbackPanelId}
              className="min-h-11 text-xs font-medium text-[#5C5346] underline-offset-2 hover:text-[#7A1E2C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C] focus-visible:ring-offset-2"
              onClick={collapseUrlFallback}
            >
              {urlCollapse}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
