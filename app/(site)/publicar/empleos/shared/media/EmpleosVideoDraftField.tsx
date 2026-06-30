"use client";

import { useCallback, useEffect, useState } from "react";

export type EmpleosVideoDraftLabels = {
  sectionTitle: string;
  hint: string;
  urlField: string;
  urlPlaceholder: string;
  applyUrl: string;
  pickFile: string;
  clear: string;
  invalidUrl?: string;
  localFileRemoved?: string;
};

type Props = {
  objectUrl: string | null;
  fileName: string;
  externalUrl: string;
  labels: EmpleosVideoDraftLabels;
  revokeIfBlob: (url: string | null) => void;
  onPatch: (p: { videoObjectUrl?: string | null; videoFileName?: string; videoUrl?: string }) => void;
};

/** External video URL only. Free/simple launch categories do not accept local video files. */
export function EmpleosVideoDraftField({ objectUrl, fileName, externalUrl, labels, revokeIfBlob, onPatch }: Props) {
  const [urlInput, setUrlInput] = useState(externalUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(externalUrl);
  }, [externalUrl]);

  const applyUrl = useCallback(() => {
    const u = urlInput.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      setError(labels.invalidUrl ?? "Use a public video URL that starts with http:// or https://.");
      return;
    }
    setError(null);
    revokeIfBlob(objectUrl);
    onPatch({ videoObjectUrl: null, videoFileName: "", videoUrl: u });
  }, [objectUrl, onPatch, revokeIfBlob, urlInput]);

  const clear = useCallback(() => {
    revokeIfBlob(objectUrl);
    setUrlInput("");
    setError(null);
    onPatch({ videoObjectUrl: null, videoFileName: "", videoUrl: "" });
  }, [objectUrl, onPatch, revokeIfBlob]);

  const src = externalUrl.trim();
  const hasVideo = Boolean(src);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[color:var(--lx-text)]">{labels.sectionTitle}</p>
      <p className="text-xs text-[color:var(--lx-muted)]">{labels.hint}</p>
      {hasVideo ? (
        <video src={src} controls className="mt-2 max-h-56 w-full rounded-lg border border-black/10 bg-black/5" />
      ) : null}
      {fileName ? (
        <p className="text-xs text-amber-800">
          {labels.localFileRemoved ?? "Local video files are no longer publishable here. Add a public video link instead."}
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block min-w-0 flex-1 text-xs font-semibold text-[color:var(--lx-text)]">
          {labels.urlField}
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            type="url"
            placeholder={labels.urlPlaceholder}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
        </label>
        <button type="button" onClick={applyUrl} className="min-h-10 rounded-lg bg-[color:var(--lx-cta-dark)] px-3 text-xs font-bold text-[#FFFCF7]">
          {labels.applyUrl}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {hasVideo ? (
          <button type="button" onClick={clear} className="text-sm font-semibold text-red-800 underline">
            {labels.clear}
          </button>
        ) : null}
      </div>
    </div>
  );
}
