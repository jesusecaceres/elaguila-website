"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { CommunityKind } from "../constants/communitySessionKeys";
import { COMMUNITY_PUBLISH_COPY } from "../copy/communityPublishCopy";
import { publishCommunityQuickToListings } from "../publish/publishCommunityQuickToListings";
import { clearCommunityStagedPublish } from "../publish/communityPublishStaging";
import {
  gateClasesQuickPreview,
  gateComunidadQuickPreview,
  shouldBlockClasesPaidPublish,
} from "../required/communityRequiredForPreview";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";

type Props = {
  kind: CommunityKind;
  draft: ClasesQuickDraft | ComunidadQuickDraft;
  lang: Lang;
};

const BTN_PUBLISH =
  "inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-full border-2 border-[#2A2620]/25 bg-[#2A2620] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#FFFCF7] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[40px] sm:flex-none sm:px-6";

export function CommunityQuickPreviewPublishBar({ kind, draft, lang }: Props) {
  const router = useRouter();
  const shared = COMMUNITY_PUBLISH_COPY[lang];
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const gate = useMemo(
    () =>
      kind === "clases"
        ? gateClasesQuickPreview(draft as ClasesQuickDraft, lang)
        : gateComunidadQuickPreview(draft as ComunidadQuickDraft, lang),
    [kind, draft, lang],
  );

  const approvalsOk =
    draft.publishConfirmations.infoTruthful &&
    draft.publishConfirmations.mediaAccurate &&
    draft.publishConfirmations.rulesAccepted;

  const paidBlocked = kind === "clases" && shouldBlockClasesPaidPublish(draft as ClasesQuickDraft);
  const publishDisabled = !gate.ok || !approvalsOk || paidBlocked || publishing;

  const publishLabel = lang === "es" ? "Publicar anuncio" : "Publish listing";
  const busyLabel = lang === "es" ? "Publicando…" : "Publishing…";
  const successLabel = lang === "es" ? "Publicado. Abriendo anuncio…" : "Published. Opening listing…";

  const publishTitleHint = paidBlocked
    ? shared.paidClassPublishBlocked
    : !gate.ok
      ? shared.publishBlocked
      : !approvalsOk
        ? shared.approvalPublishBlocked
        : undefined;

  const handlePublish = async () => {
    if (publishDisabled) return;
    setPublishError(null);
    setPublishSuccess(null);
    setPublishing(true);
    try {
      if (kind === "clases" && shouldBlockClasesPaidPublish(draft as ClasesQuickDraft)) {
        setPublishError(shared.paidClassPublishBlocked);
        return;
      }
      const r = await publishCommunityQuickToListings({
        kind,
        draft,
        lang,
      });
      if (!r.ok) {
        setPublishError(r.error);
        return;
      }
      setPublishSuccess(successLabel);
      try {
        window.sessionStorage.setItem(`leonix-community-publish-success:${r.listingId}`, "1");
      } catch {
        /* sessionStorage can be unavailable; redirect still provides completion feedback by URL. */
      }
      clearCommunityStagedPublish(kind);
      router.push(`/clasificados/anuncio/${r.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:max-w-[min(100%,520px)] sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
      <button
        type="button"
        className={BTN_PUBLISH}
        disabled={publishDisabled}
        title={publishTitleHint}
        onClick={() => void handlePublish()}
      >
        {publishing ? busyLabel : publishLabel}
      </button>
      {publishError ? (
        <p
          className="w-full rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-950 sm:order-last sm:max-w-md"
          role="alert"
        >
          {publishError}
        </p>
      ) : null}
      {publishSuccess ? (
        <p
          className="w-full rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 text-xs font-medium text-emerald-950 sm:order-last sm:max-w-md"
          role="status"
          data-testid="community-publish-success-inline"
        >
          {publishSuccess}
        </p>
      ) : null}
      {paidBlocked ? (
        <p className="w-full text-xs font-medium text-amber-950 sm:max-w-md" role="status">
          {shared.paidClassPublishBlocked}
        </p>
      ) : null}
    </div>
  );
}
