"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

import {
  COMMUNITY_SESSION_KEYS,
  type CommunityKind,
} from "../constants/communitySessionKeys";
import { communityQuickEditUrl } from "../constants/communityPublishRoutes";
import { COMMUNITY_PUBLISH_COPY } from "../copy/communityPublishCopy";
import {
  ClasesQuickPreviewCard,
  ComunidadQuickPreviewCard,
} from "./CommunityQuickPreviewCard";
import { CommunityQuickPreviewPublishBar } from "./CommunityQuickPreviewPublishBar";
import {
  normalizeClasesQuickDraft,
  normalizeComunidadQuickDraft,
  type ClasesQuickDraft,
  type ComunidadQuickDraft,
} from "../types/communityQuickDraft";

export function CommunityQuickPreviewClient({ kind }: { kind: CommunityKind }) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const fromPublicar = sp?.get("from") === "publicar";

  const [clasesDraft, setClasesDraft] = useState<ClasesQuickDraft | null>(null);
  const [comunidadDraft, setComunidadDraft] = useState<ComunidadQuickDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(COMMUNITY_SESSION_KEYS[kind]);
      if (!raw) {
        if (kind === "clases") setClasesDraft(null);
        else setComunidadDraft(null);
      } else {
        const parsed = JSON.parse(raw);
        if (kind === "clases") {
          setClasesDraft(normalizeClasesQuickDraft(parsed));
        } else {
          setComunidadDraft(normalizeComunidadQuickDraft(parsed));
        }
      }
    } catch {
      if (kind === "clases") setClasesDraft(null);
      else setComunidadDraft(null);
    } finally {
      setReady(true);
    }
  }, [kind]);

  const editHref = communityQuickEditUrl(kind, lang);
  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  const noDraft = COMMUNITY_PUBLISH_COPY[lang].previewNoDraft;

  const draft = kind === "clases" ? clasesDraft : comunidadDraft;

  if (!ready) {
    return <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" />;
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#ECEAE7] px-4 py-10 text-center text-sm text-[#5C564E]">
        <p>{noDraft.message}</p>
        <Link href={editHref} className="mt-4 inline-block font-semibold text-[#2563EB] underline">
          {noDraft.backLink}
        </Link>
      </div>
    );
  }

  void fromPublicar;

  const publishSlot =
    kind === "clases" && clasesDraft ? (
      <CommunityQuickPreviewPublishBar kind="clases" draft={clasesDraft} lang={lang} />
    ) : kind === "comunidad" && comunidadDraft ? (
      <CommunityQuickPreviewPublishBar kind="comunidad" draft={comunidadDraft} lang={lang} />
    ) : null;

  return (
    <LeonixPreviewPageShell
      editHref={editHref}
      backLabel={backLabel}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      publishSlot={publishSlot}
    >
      <div className="mx-auto w-full max-w-[min(100%,1240px)] px-3 pb-28 pt-2 sm:px-5">
        {kind === "clases" && clasesDraft ? (
          <ClasesQuickPreviewCard draft={clasesDraft} lang={lang} />
        ) : null}
        {kind === "comunidad" && comunidadDraft ? (
          <ComunidadQuickPreviewCard draft={comunidadDraft} lang={lang} />
        ) : null}
      </div>
    </LeonixPreviewPageShell>
  );
}
