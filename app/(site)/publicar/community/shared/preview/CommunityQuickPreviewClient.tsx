"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { CommunityQuickPublicDetailShell } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailShell";
import { CommunityQuickPublicDetailSidebar } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { ClasesQuickAdCanvas } from "@/app/(site)/publicar/clases/components/ClasesQuickAdCanvas";
import { ComunidadQuickAdCanvas } from "@/app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas";
import { CommunityDiscoveryListingCard } from "@/app/(site)/clasificados/community/CommunityDiscoveryListingCard";
import { buildCommunityDiscoveryCardModelFromDraft } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";

import {
  COMMUNITY_SESSION_KEYS,
  type CommunityKind,
} from "../constants/communitySessionKeys";
import { communityQuickEditUrl } from "../constants/communityPublishRoutes";
import { COMMUNITY_PUBLISH_COPY } from "../copy/communityPublishCopy";
import { CommunityQuickPreviewPublishBar } from "./CommunityQuickPreviewPublishBar";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import {
  normalizeClasesQuickDraft,
  normalizeComunidadQuickDraft,
  type ClasesQuickDraft,
  type ComunidadQuickDraft,
} from "../types/communityQuickDraft";

export function CommunityQuickPreviewClient({ kind }: { kind: CommunityKind }) {
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(sp?.get("lang")),
    [sp],
  );
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

  const editHref = communityQuickEditUrl(kind, routeLang);
  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  const noDraft = COMMUNITY_PUBLISH_COPY[lang].previewNoDraft;

  const draft = kind === "clases" ? clasesDraft : comunidadDraft;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(lang === "es" ? "Copiado." : "Copied.");
    } catch {
      window.prompt(lang === "es" ? "Copia este enlace:" : "Copy this link:", text);
    }
  };

  const buildShareMessage = () => {
    if (!draft) return "";
    const title = draft.title.trim();
    const city = draft.publicCity.trim();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const cost =
      kind === "clases"
        ? (draft as ClasesQuickDraft).classCostType === "gratis"
          ? lang === "es"
            ? "Gratis"
            : "Free"
          : (draft as ClasesQuickDraft).priceAmount
        : (draft as ComunidadQuickDraft).eventCost;
    return `${title} — ${cost} (${city})\n${url}`;
  };

  if (!ready) {
    return <div className="min-h-screen bg-[#F8F4EA]" aria-busy="true" data-testid="leonix-public-detail-shell" />;
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#F8F4EA] px-4 py-10 text-center text-sm text-[#5C564E]">
        <p>{noDraft.message}</p>
        <Link href={editHref} className="mt-4 inline-block font-semibold text-[#2563EB] underline">
          {noDraft.backLink}
        </Link>
      </div>
    );
  }

  void fromPublicar;

  const organizerName = draft.organizer.trim() || "—";
  const previewLeonixAdId = formatLeonixAdId(draft.previewListingId);

  const cardModel = useMemo(() => {
    if (!draft) return null;
    const detailHref = typeof window !== "undefined" ? window.location.href : "";
    return buildCommunityDiscoveryCardModelFromDraft(draft, kind, lang, detailHref);
  }, [draft, kind, lang]);

  const adBody =
    kind === "clases" ? (
      <ClasesQuickAdCanvas
        draft={draft as ClasesQuickDraft}
        lang={lang}
        shell="embedded"
        contactSectionId="contact-actions"
        heroTestId="community-anuncio-hero"
        leonixAdId={previewLeonixAdId}
      />
    ) : (
      <ComunidadQuickAdCanvas
        draft={draft as ComunidadQuickDraft}
        lang={lang}
        shell="embedded"
        contactSectionId="contact-actions"
        heroTestId="community-anuncio-hero"
        leonixAdId={previewLeonixAdId}
      />
    );

  return (
    <CommunityQuickPublicDetailShell
      lang={lang}
      mode="preview"
      topBar={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {kind === "clases" && clasesDraft ? (
            <CommunityQuickPreviewPublishBar kind="clases" draft={clasesDraft} lang={lang} routeLang={routeLang} />
          ) : null}
          {kind === "comunidad" && comunidadDraft ? (
            <CommunityQuickPreviewPublishBar kind="comunidad" draft={comunidadDraft} lang={lang} routeLang={routeLang} />
          ) : null}
          <Link
            href={editHref}
            prefetch={false}
            onClick={() => markPublishFlowReturningToEdit()}
            className="px-5 py-2.5 rounded-full border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] text-[#111111] font-semibold hover:bg-[#D9D9D9]/45 transition"
          >
            {backLabel}
          </Link>
        </div>
      }
      adBody={
        <>
          {adBody}
          {cardModel ? (
            <div className="mt-8 rounded-2xl border border-[#C9B46A]/35 bg-[#FFFDF7] p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C564E]">
                  {lang === "es" ? "Vista previa en resultados" : "Results card preview"}
                </h2>
                <p className="mt-1 text-xs text-[#5C564E]/80">
                  {lang === "es"
                    ? "Así puede aparecer tu evento en los resultados de Comunidad/Eventos."
                    : "This is how your event may appear in Community/Event results."}
                </p>
              </div>
              <div className="max-w-md">
                <CommunityDiscoveryListingCard model={cardModel} lang={lang} variant={kind} />
              </div>
            </div>
          ) : null}
        </>
      }
      sidebar={
        <CommunityQuickPublicDetailSidebar
          lang={lang}
          mode="preview"
          organizerName={organizerName}
          onShare={() => void copyText(buildShareMessage())}
          onCopyLink={() => void copyText(typeof window !== "undefined" ? window.location.href : "")}
          onCopyInfo={() => void copyText(buildShareMessage())}
        />
      }
    />
  );
}
