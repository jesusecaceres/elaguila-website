"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { withClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import type { SupportedLang } from "@/app/lib/language";

import { gateMascotasPerdidosQuickPreview } from "../../shared/mascotasPerdidosRequiredForPreview";
import { publishMascotasPerdidosQuickToListings } from "../../shared/publishMascotasPerdidosQuickToListings";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "../../shared/mascotasPerdidosSessionKeys";
import type { MascotasPerdidosQuickDraft } from "../../shared/mascotasPerdidosQuickTypes";
import { mascotasPerdidosPreviewCopy } from "../../shared/mascotasPerdidosPreviewCopy";

const BTN_PUBLISH =
  "inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-[#F5F5F5] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[11rem] sm:flex-none";

export function MascotasPerdidosQuickPreviewPublishBar({
  draft,
  lang,
  routeLang,
}: {
  draft: MascotasPerdidosQuickDraft;
  lang: Lang;
  routeLang: SupportedLang;
}) {
  const router = useRouter();
  const t = mascotasPerdidosPreviewCopy(lang);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const gate = useMemo(() => gateMascotasPerdidosQuickPreview(draft, lang), [draft, lang]);
  const publishDisabled = !gate.ok || publishing;

  const handlePublish = async () => {
    if (publishDisabled) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const r = await publishMascotasPerdidosQuickToListings({ draft, lang });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      try {
        window.sessionStorage.setItem(`leonix-mascotas-perdidos-publish-success:${r.listingId}`, "1");
        window.sessionStorage.removeItem(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY);
      } catch {
        /* optional */
      }
      router.push(withClasificadosPublishLang(`/clasificados/anuncio/${r.listingId}`, routeLang));
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
        title={!gate.ok ? t.blockedHint : undefined}
        onClick={() => void handlePublish()}
        data-testid="mascotas-perdidos-preview-publish"
      >
        {publishing ? t.publishing : t.publishFree}
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
