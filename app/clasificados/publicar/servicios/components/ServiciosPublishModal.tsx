"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FiX } from "react-icons/fi";
import { upsertLocalServiciosPublish } from "@/app/clasificados/servicios/lib/localServiciosPublishStorage";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosCopy } from "../lib/clasificadosServiciosApplicationCopy";
import type { ClasificadosServiciosApplicationState } from "../lib/clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "../lib/clasificadosServiciosApplicationTypes";
import { evaluateServiciosPublishReadiness } from "../lib/serviciosPublishReadiness";

export function ServiciosPublishModal({
  open,
  onClose,
  state,
  lang,
  copy,
  onPersistDraft,
}: {
  open: boolean;
  onClose: () => void;
  state: ClasificadosServiciosApplicationState;
  lang: ServiciosLang;
  copy: ClasificadosServiciosCopy;
  /** Ensure latest draft is flushed before publishing */
  onPersistDraft: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readiness = evaluateServiciosPublishReadiness(state, lang);

  const handlePublish = useCallback(async () => {
    if (!readiness.ok) return;
    setBusy(true);
    setError(null);
    onPersistDraft();
    try {
      const res = await fetch("/api/clasificados/servicios/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, lang }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        slug?: string;
        persisted?: boolean;
        profile?: ServiciosBusinessProfile;
        missing?: { label: string }[];
      };

      if (res.status === 422 && data.missing?.length) {
        setError(copy.publishError);
        setBusy(false);
        return;
      }

      if (!data.ok || !data.slug || !data.profile) {
        setError(copy.publishError);
        setBusy(false);
        return;
      }

      if (!data.persisted) {
        upsertLocalServiciosPublish(data.profile, state.city);
      }

      router.push(`/clasificados/servicios/${encodeURIComponent(data.slug)}?lang=${lang}`);
    } catch {
      setError(copy.publishError);
      setBusy(false);
    }
  }, [readiness.ok, state, lang, copy.publishError, router, onPersistDraft]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="servicios-publish-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-5 shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-[#5D4A25]/70 transition hover:bg-black/[0.04]"
          aria-label={copy.publishClose}
        >
          <FiX className="h-5 w-5" />
        </button>

        <h2 id="servicios-publish-title" className="pr-10 text-lg font-bold text-[#3D2C12]">
          {copy.publishModalTitle}
        </h2>

        {!readiness.ok ? (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-[#5D4A25]/90">{copy.publishModalIntro}</p>
            <p className="mt-4 text-sm font-semibold text-[#3D2C12]">{copy.publishMissingTitle}</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#5D4A25]">
              {readiness.missing.map((m) => (
                <li key={m.id}>{m.label}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full min-h-[48px] rounded-xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {copy.publishClose}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-[#5D4A25]/90">{copy.publishModalIntro}</p>
            {error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-xl border border-[#D8C79A]/80 bg-white px-4 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
              >
                {copy.publishClose}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handlePublish()}
                className="min-h-[44px] rounded-xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699] disabled:opacity-60"
              >
                {busy ? copy.publishBusy : copy.publishSubmit}
              </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[#8a7a62]">{copy.publishLocalNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
