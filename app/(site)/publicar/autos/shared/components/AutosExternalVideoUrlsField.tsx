"use client";

import { useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  AUTOS_MAX_EXTERNAL_VIDEO_URLS,
  dedupeAutosVideoUrls,
  normalizeAutosExternalVideoUrl,
  parseBulkAutosExternalVideoUrls,
} from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import {
  autosExternalVideoAddCta,
  autosExternalVideoBulkAddCta,
  autosExternalVideoBulkCancelCta,
  autosExternalVideoBulkEmpty,
  autosExternalVideoBulkHelper,
  autosExternalVideoBulkPlaceholder,
  autosExternalVideoBulkResultSummary,
  autosExternalVideoBulkToggleCta,
  autosExternalVideoDescription,
  autosExternalVideoDuplicate,
  autosExternalVideoHelper,
  autosExternalVideoInvalid,
  autosExternalVideoLimitReached,
  autosExternalVideoListLabel,
  autosExternalVideoPlaceholder,
  autosExternalVideoRemoveCta,
  autosExternalVideoSecondaryHelper,
  autosExternalVideoTitle,
} from "@/app/lib/clasificados/autos/autosExternalVideoUrlsCopy";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-90";

type Props = {
  lang: AutosNegociosLang;
  videoUrls: string[] | undefined;
  onChange: (urls: string[]) => void;
  insideModal?: boolean;
};

export function AutosExternalVideoUrlsField({ lang, videoUrls, onChange, insideModal = false }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDraft, setBulkDraft] = useState("");
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const urls = dedupeAutosVideoUrls(videoUrls ?? []);
  const atLimit = urls.length >= AUTOS_MAX_EXTERNAL_VIDEO_URLS;

  const addUrl = () => {
    const normalized = normalizeAutosExternalVideoUrl(draft);
    if (!normalized) {
      setError(autosExternalVideoInvalid(lang));
      return;
    }
    if (urls.some((u) => u.toLowerCase() === normalized.toLowerCase())) {
      setError(autosExternalVideoDuplicate(lang));
      return;
    }
    if (atLimit) {
      setError(autosExternalVideoLimitReached(lang));
      return;
    }
    onChange([...urls, normalized]);
    setDraft("");
    setError(null);
  };

  const addBulkUrls = () => {
    if (!bulkDraft.trim()) {
      setBulkSummary(autosExternalVideoBulkEmpty(lang));
      return;
    }
    const result = parseBulkAutosExternalVideoUrls(bulkDraft, urls);
    if (result.added.length > 0) {
      onChange([...urls, ...result.added]);
    }
    setBulkSummary(
      autosExternalVideoBulkResultSummary(
        lang,
        result.added.length,
        result.skippedInvalid,
        result.skippedDuplicate,
        result.skippedLimit,
      ),
    );
    setBulkDraft("");
  };

  const modalHandlers = insideModal
    ? {
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }
    : {};

  return (
    <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
      <h3 className="text-sm font-bold text-[color:var(--lx-text)]">{autosExternalVideoTitle(lang)}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{autosExternalVideoDescription(lang)}</p>
      <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{autosExternalVideoHelper(lang)}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosExternalVideoSecondaryHelper(lang)}</p>

      {!atLimit ? (
        <div className="mt-4">
          {!bulkMode ? (
            <>
              <label className={LABEL}>{autosExternalVideoAddCta(lang)}</label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                <input
                  className={`${INPUT} sm:min-w-0 sm:flex-1`}
                  placeholder={autosExternalVideoPlaceholder(lang)}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  {...modalHandlers}
                />
                <button type="button" className={BTN_SECONDARY} onClick={addUrl}>
                  {autosExternalVideoAddCta(lang)}
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-xs font-medium text-red-800" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[color:var(--lx-gold)] underline"
                onClick={() => {
                  setBulkMode(true);
                  setBulkSummary(null);
                  setError(null);
                }}
              >
                {autosExternalVideoBulkToggleCta(lang)}
              </button>
            </>
          ) : (
            <>
              <label className={LABEL}>{autosExternalVideoBulkToggleCta(lang)}</label>
              <textarea
                className={`${INPUT} mt-1 min-h-[96px]`}
                placeholder={autosExternalVideoBulkPlaceholder(lang)}
                value={bulkDraft}
                onChange={(e) => {
                  setBulkDraft(e.target.value);
                  if (bulkSummary) setBulkSummary(null);
                }}
                {...modalHandlers}
              />
              <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">
                {autosExternalVideoBulkHelper(lang)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" className={BTN_SECONDARY} onClick={addBulkUrls}>
                  {autosExternalVideoBulkAddCta(lang)}
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-[color:var(--lx-gold)] underline"
                  onClick={() => {
                    setBulkMode(false);
                    setBulkDraft("");
                    setBulkSummary(null);
                  }}
                >
                  {autosExternalVideoBulkCancelCta(lang)}
                </button>
              </div>
              {bulkSummary ? (
                <p className="mt-2 text-xs font-medium text-[color:var(--lx-text-2)]" role="status">
                  {bulkSummary}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs font-semibold text-[#6E5418]">{autosExternalVideoLimitReached(lang)}</p>
      )}

      {urls.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {urls.map((url, i) => (
            <li
              key={url}
              className="flex flex-col gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[color:var(--lx-text)]">{autosExternalVideoListLabel(lang, i)}</p>
                <p className="truncate text-xs text-[color:var(--lx-text-2)]">{url}</p>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-red-800 underline"
                onClick={() => onChange(urls.filter((u) => u !== url))}
              >
                {autosExternalVideoRemoveCta(lang)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
