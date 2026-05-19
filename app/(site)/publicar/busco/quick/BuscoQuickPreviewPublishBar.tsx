"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { gateBuscoQuickPreview } from "../shared/buscoRequiredForPreview";
import { publishBuscoQuickToListings } from "../shared/publishBuscoQuickToListings";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import type { BuscoQuickDraft } from "../shared/buscoQuickTypes";

const BTN_PUBLISH =
  "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-[#F5F5F5] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[11rem] sm:flex-none";

export function BuscoQuickPreviewPublishBar({ draft, lang }: { draft: BuscoQuickDraft; lang: Lang }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const gate = useMemo(() => gateBuscoQuickPreview(draft, lang), [draft, lang]);
  const publishDisabled = !gate.ok || publishing;

  const publishLabel = lang === "es" ? "Publicar solicitud" : "Publish request";
  const busyLabel = lang === "es" ? "Publicando…" : "Publishing…";
  const blockedHint =
    lang === "es" ? "Completa los campos requeridos antes de publicar." : "Complete required fields before publishing.";

  const handlePublish = async () => {
    if (publishDisabled) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const r = await publishBuscoQuickToListings({ draft, lang });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      try {
        window.sessionStorage.setItem(`leonix-busco-publish-success:${r.listingId}`, "1");
        window.sessionStorage.removeItem(BUSCO_QUICK_DRAFT_KEY);
      } catch {
        /* sessionStorage optional */
      }
      router.push(`/clasificados/anuncio/${r.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-1">
      <button
        type="button"
        className={BTN_PUBLISH}
        disabled={publishDisabled}
        title={!gate.ok ? blockedHint : undefined}
        onClick={() => void handlePublish()}
        data-testid="busco-preview-publish"
      >
        {publishing ? busyLabel : publishLabel}
      </button>
      {publishError ? (
        <p
          className="w-full rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-950"
          role="alert"
        >
          {publishError}
        </p>
      ) : null}
    </div>
  );
}
