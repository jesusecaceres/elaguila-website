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
  addVideo?: string;
  remove?: string;
  limitHint?: string;
  duplicateUrl?: string;
  emptyUrl?: string;
  invalidUrl?: string;
  localFileRemoved?: string;
};

type Props = {
  objectUrl: string | null;
  fileName: string;
  externalUrl: string;
  videoUrls?: string[];
  maxUrls?: number;
  labels: EmpleosVideoDraftLabels;
  revokeIfBlob: (url: string | null) => void;
  onPatch: (p: { videoObjectUrl?: string | null; videoFileName?: string; videoUrl?: string; videoUrls?: string[] }) => void;
};

/** External video URL only. Free/simple launch categories do not accept local video files. */
export function EmpleosVideoDraftField({
  objectUrl,
  fileName,
  externalUrl,
  videoUrls,
  maxUrls = 4,
  labels,
  revokeIfBlob,
  onPatch,
}: Props) {
  const [urlInput, setUrlInput] = useState(externalUrl);
  const [error, setError] = useState<string | null>(null);
  const urls = Array.from(
    new Set(
      [...(videoUrls ?? []), externalUrl]
        .map((u) => String(u ?? "").trim())
        .filter((u) => /^https?:\/\//i.test(u)),
    ),
  ).slice(0, maxUrls);

  useEffect(() => {
    if (!urlInput.trim()) setUrlInput(externalUrl);
  }, [externalUrl, urlInput]);

  const applyUrl = useCallback(() => {
    const u = urlInput.trim();
    if (!u) {
      setError(labels.emptyUrl ?? "Paste a video link first.");
      return;
    }
    if (!/^https?:\/\//i.test(u)) {
      setError(labels.invalidUrl ?? "Use a public video URL that starts with http:// or https://.");
      return;
    }
    if (urls.some((existing) => existing.toLowerCase() === u.toLowerCase())) {
      setError(labels.duplicateUrl ?? "That link was already added.");
      return;
    }
    if (urls.length >= maxUrls) {
      setError(labels.limitHint ?? `You can add up to ${maxUrls} video links.`);
      return;
    }
    const next = [...urls, u].slice(0, maxUrls);
    setError(null);
    setUrlInput("");
    revokeIfBlob(objectUrl);
    onPatch({ videoObjectUrl: null, videoFileName: "", videoUrl: next[0] ?? "", videoUrls: next });
  }, [labels.duplicateUrl, labels.emptyUrl, labels.invalidUrl, labels.limitHint, maxUrls, objectUrl, onPatch, revokeIfBlob, urlInput, urls]);

  const clear = useCallback(() => {
    revokeIfBlob(objectUrl);
    setUrlInput("");
    setError(null);
    onPatch({ videoObjectUrl: null, videoFileName: "", videoUrl: "", videoUrls: [] });
  }, [objectUrl, onPatch, revokeIfBlob]);

  const removeUrl = useCallback(
    (url: string) => {
      const next = urls.filter((u) => u !== url);
      setError(null);
      onPatch({ videoObjectUrl: null, videoFileName: "", videoUrl: next[0] ?? "", videoUrls: next });
    },
    [onPatch, urls],
  );

  return (
    <div className="space-y-3 rounded-xl border border-[#C9B46A]/35 bg-[#FFFCF7] p-4 ring-1 ring-[#C9B46A]/10">
      <div>
        <p className="text-sm font-semibold text-[color:var(--lx-text)]">{labels.sectionTitle}</p>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{labels.hint}</p>
        {labels.limitHint ? <p className="mt-1 text-xs font-medium text-[#6B5320]">{labels.limitHint}</p> : null}
      </div>
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
          {labels.addVideo ?? labels.applyUrl}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
      {urls.length ? (
        <ul className="space-y-2">
          {urls.map((url, i) => (
            <li key={url} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[color:var(--lx-text)]">
                  {labels.urlField} {i + 1}
                </p>
                <p className="truncate text-xs text-[color:var(--lx-muted)]">{url}</p>
              </div>
              <button type="button" onClick={() => removeUrl(url)} className="shrink-0 text-xs font-bold text-red-800 underline">
                {labels.remove ?? labels.clear}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {urls.length ? (
        <button type="button" onClick={clear} className="text-sm font-semibold text-red-800 underline">
          {labels.clear}
        </button>
      ) : null}
    </div>
  );
}
