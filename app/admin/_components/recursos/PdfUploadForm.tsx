"use client";

/**
 * Recursos Intake OS — Gate 4 PDF upload form. Client-side validation here is supplemental only
 * (accept="application/pdf", a size hint) — the actual enforcement happens server-side in
 * app/api/admin/recursos/intake/pdf-upload/route.ts, which never trusts this component.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminBtnPrimary, adminInputClass } from "@/app/admin/_components/adminTheme";

const MAX_MB = 25;

export function PdfUploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("pdf") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Selecciona un archivo PDF.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo excede ${MAX_MB} MB.`);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData(form);
      const res = await fetch("/api/admin/recursos/intake/pdf-upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se pudo procesar el PDF.");
        setBusy(false);
        return;
      }
      if (json.duplicate) {
        setError(json.message);
        setBusy(false);
        return;
      }
      router.push(`/admin/recursos/intake/${encodeURIComponent(json.jobId)}`);
    } catch {
      setError("Error de red al subir el archivo.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-1 flex flex-col gap-3">
      <div>
        <label htmlFor="pdf" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Archivo PDF (máx. {MAX_MB} MB)
        </label>
        <input id="pdf" name="pdf" type="file" accept="application/pdf" required className={adminInputClass} />
      </div>
      <div>
        <label htmlFor="title" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Título del documento (opcional)
        </label>
        <input id="title" name="title" type="text" placeholder="Guía de recursos comunitarios 2026" className={adminInputClass} />
      </div>
      <div>
        <label htmlFor="sourceDate" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Fecha de la fuente (opcional)
        </label>
        <input id="sourceDate" name="sourceDate" type="date" className={adminInputClass} />
      </div>
      {error ? <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</p> : null}
      <button type="submit" disabled={busy} className={`${adminBtnPrimary} w-fit disabled:opacity-50`}>
        {busy ? "Analizando…" : "Analizar PDF"}
      </button>
    </form>
  );
}
