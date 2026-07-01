"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CommunityQuickPublicDetailShell } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailShell";
import { CommunityQuickPublicDetailSidebar } from "@/app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar";
import { buscoLangFromSearchParams } from "@/app/(site)/clasificados/busco/shared/buscoShellCopy";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { BuscoQuickAdCanvas } from "@/app/(site)/publicar/busco/components/BuscoQuickAdCanvas";
import { buscoViewModelFromDraft } from "@/app/(site)/publicar/busco/shared/buscoQuickAdViewModel";

import { normalizeBuscoQuickDraft } from "../shared/buscoQuickDraft";
import { buscoQuickEditUrl } from "../shared/buscoPublishRoutes";
import type { BuscoQuickDraft } from "../shared/buscoQuickTypes";
import { BUSCO_QUICK_DRAFT_KEY } from "../shared/buscoSessionKeys";
import { BuscoQuickPreviewPublishBar } from "./BuscoQuickPreviewPublishBar";

const COPY = {
  es: {
    noDraft: "No hay borrador para previsualizar.",
    backToForm: "Volver al formulario",
    edit: "Volver a editar",
    previewNote: "Vista previa — aún no se publica en Leonix Clasificados.",
  },
  en: {
    noDraft: "No draft to preview.",
    backToForm: "Back to form",
    edit: "Back to edit",
    previewNote: "Preview — not published on Leonix Classifieds yet.",
  },
} as const;

export default function BuscoQuickPreviewClient() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = COPY[lang];
  const [draft, setDraft] = useState<BuscoQuickDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(BUSCO_QUICK_DRAFT_KEY);
      if (!raw) setDraft(null);
      else setDraft(normalizeBuscoQuickDraft(JSON.parse(raw)));
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = buscoQuickEditUrl(lang);
  const vm = useMemo(() => (draft ? buscoViewModelFromDraft(draft, lang) : null), [draft, lang]);

  if (!ready) {
    return <div className="min-h-screen bg-[#F8F4EA]" aria-busy="true" data-testid="busco-preview-loading" />;
  }

  if (!draft || !vm) {
    return (
      <div className="min-h-screen bg-[#F8F4EA] px-4 py-28 text-center text-sm text-[#5C564E]">
        <p>{t.noDraft}</p>
        <Link href={editHref} className="mt-4 inline-block font-semibold text-[#7A1E2C] underline">
          {t.backToForm}
        </Link>
      </div>
    );
  }

  const buildShareMessage = () => {
    const title = draft.title.trim();
    const city = draft.city.trim();
    const url = typeof window !== "undefined" ? window.location.href : "";
    return `${title} (${city})\n${url}`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(lang === "es" ? "Copiado." : "Copied.");
    } catch {
      window.prompt(lang === "es" ? "Copia este enlace:" : "Copy this link:", text);
    }
  };

  return (
    <CommunityQuickPublicDetailShell
      lang={lang}
      mode="preview"
      topBar={
        <div className="space-y-3">
          <p className="rounded-xl border border-[#C9B46A]/35 bg-[#FBF7EF]/90 px-3 py-2 text-xs font-medium text-[#5C564E]">
            {t.previewNote}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <BuscoQuickPreviewPublishBar draft={draft} lang={lang} />
            <Link
              href={editHref}
              prefetch={false}
              onClick={() => markPublishFlowReturningToEdit()}
              className="inline-flex min-h-[40px] items-center rounded-full border border-[#C9B46A]/55 bg-[#FFFDF7] px-5 py-2.5 text-sm font-semibold text-[#3D3428] shadow-sm transition hover:bg-[#F5EDD8]"
            >
              {t.edit}
            </Link>
          </div>
        </div>
      }
      adBody={
        <BuscoQuickAdCanvas
          vm={vm}
          lang={lang}
          shell="embedded"
          contactSectionId="contact-actions"
        />
      }
      sidebar={
        <CommunityQuickPublicDetailSidebar
          lang={lang}
          mode="preview"
          organizerName={lang === "es" ? "Solicitante" : "Requester"}
          onShare={() => void copyText(buildShareMessage())}
          onCopyLink={() => void copyText(typeof window !== "undefined" ? window.location.href : "")}
          onCopyInfo={() => void copyText(buildShareMessage())}
        />
      }
    />
  );
}
