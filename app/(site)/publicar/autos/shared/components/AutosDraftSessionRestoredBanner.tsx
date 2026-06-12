"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDraftRestoredFromSessionNote,
  autosLocalFilesReselectAfterRefreshNote,
} from "@/app/lib/clasificados/autos/autosDraftSessionCopy";

export function AutosDraftSessionRestoredBanner({
  lang,
  restoredFromSession,
  showLocalFileReselectHint = false,
}: {
  lang: AutosNegociosLang;
  restoredFromSession: boolean;
  showLocalFileReselectHint?: boolean;
}) {
  if (!restoredFromSession && !showLocalFileReselectHint) return null;

  return (
    <div className="mb-4 space-y-2">
      {restoredFromSession ? (
        <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs leading-relaxed text-emerald-950">
          {autosDraftRestoredFromSessionNote(lang)}
        </p>
      ) : null}
      {showLocalFileReselectHint ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {autosLocalFilesReselectAfterRefreshNote(lang)}
        </p>
      ) : null}
    </div>
  );
}
