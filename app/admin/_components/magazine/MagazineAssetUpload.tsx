"use client";

import { useState } from "react";

type Props = {
  year: string;
  monthSlug: string;
  onUploaded: (url: string, kind: "cover" | "pdf") => void;
};

export function MagazineAssetUpload({ year, monthSlug, onUploaded }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload(kind: "cover" | "pdf", file: File | null) {
    setMsg(null);
    if (!file || !year.trim() || !monthSlug.trim()) {
      setMsg("Choose year, month, and a file.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("year", year.trim());
      fd.set("monthSlug", monthSlug.trim().toLowerCase());
      fd.set("kind", kind);
      fd.set("file", file);
      fd.set("originalFilename", file.name);
      const res = await fetch("/api/admin/magazine/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string; code?: string };
      if (!res.ok || !j.ok || !j.publicUrl) {
        setMsg(j.error ?? j.code ?? "Upload failed");
        return;
      }
      onUploaded(j.publicUrl, kind);
      setMsg(kind === "cover" ? "Cover uploaded — URL applied below." : "PDF uploaded — URL applied below.");
    } catch {
      setMsg("Network error while uploading.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]">
      <p className="text-xs font-bold uppercase text-[#7A7164]">Vercel Blob upload (admin)</p>
      <p className="mt-1 text-xs text-[#7A7164]">
        Requires <code className="rounded bg-white/90 px-1">BLOB_READ_WRITE_TOKEN</code>. Use the same year/month as the issue (slug in English: january, february…).
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void upload("cover", f);
            }}
          />
          {busy ? "…" : "Upload cover"}
        </label>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void upload("pdf", f);
            }}
          />
          {busy ? "…" : "Upload PDF"}
        </label>
      </div>
      {msg ? <p className="mt-2 text-xs font-semibold text-[#1E1810]">{msg}</p> : null}
    </div>
  );
}
