"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { autosLocalFileTemporaryDraftNote } from "@/app/lib/clasificados/autos/autosDraftLocalMediaCopy";

export function AutosLocalFileTemporaryDraftNote({ lang }: { lang: AutosNegociosLang }) {
  return (
    <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
      {autosLocalFileTemporaryDraftNote(lang)}
    </p>
  );
}
