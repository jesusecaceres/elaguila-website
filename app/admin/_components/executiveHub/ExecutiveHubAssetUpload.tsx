"use client";

import { useState } from "react";

/** Same Vercel Blob upload architecture as `MagazineAssetUpload.tsx` — reused pattern, executive-scoped kinds. */
type Kind = "headshot" | "logo" | "cover";

type Props = {
  slug: string;
  kind: Kind;
  label: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  /** Clears the stored path — image stops rendering on Preview/public page after Save. */
  onRemoved?: () => void;
};

export function ExecutiveHubAssetUpload({ slug, kind, label, currentUrl, onUploaded, onRemoved }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload(file: File | null) {
    setMsg(null);
    if (!file || !slug.trim()) {
      setMsg("Save a slug first, then upload.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("slug", slug.trim());
      fd.set("kind", kind);
      fd.set("file", file);
      fd.set("originalFilename", file.name);
      const res = await fetch("/api/admin/executive-hub/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string; code?: string };
      if (!res.ok || !j.ok || !j.publicUrl) {
        setMsg(j.error ?? j.code ?? "Upload failed");
        return;
      }
      onUploaded(j.publicUrl);
      setMsg("Uploaded — preview updated below.");
    } catch {
      setMsg("Network error while uploading.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]">
      <p className="text-xs font-bold uppercase text-[#7A7164]">{label}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={label}
            className="h-16 w-16 shrink-0 rounded-lg border border-[#E8DFD0] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E8DFD0] text-[10px] text-[#7A7164]">
            No image
          </div>
        )}
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              void upload(f);
            }}
          />
          {busy ? "Uploading…" : currentUrl ? "Replace image" : "Upload image"}
        </label>
        {currentUrl && onRemoved ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Remove ${label.toLowerCase()}? This takes effect after you save.`)) return;
              onRemoved();
              setMsg("Removed — save to apply.");
            }}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100"
          >
            Remove image
          </button>
        ) : null}
      </div>
      {msg ? <p className="mt-2 text-xs font-semibold text-[#1E1810]">{msg}</p> : null}
    </div>
  );
}
