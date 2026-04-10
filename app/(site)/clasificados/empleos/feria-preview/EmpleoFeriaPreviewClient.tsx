"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { clearLeonixPreviewNavSessionFlag, markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { EmpleoJobFairDetailPage } from "../components/jobFair/EmpleoJobFairDetailPage";
import { EMPLEOS_SESSION_KEYS } from "@/app/publicar/empleos/shared/constants/empleosSessionKeys";
import { EMPLEOS_PUBLISH_ROUTES } from "@/app/publicar/empleos/shared/constants/empleosPublishRoutes";
import { EMPLEOS_PUBLISH_SHARED_COPY } from "@/app/publicar/empleos/shared/copy/empleosPublishSharedCopy";
import { mapFeriaDraftToShell } from "@/app/publicar/empleos/shared/mappers/mapFeriaDraftToShell";
import { normalizeEmpleosFeriaDraft, type EmpleosFeriaDraft } from "@/app/publicar/empleos/shared/types/empleosFeriaDraft";

export function EmpleoFeriaPreviewClient() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const fromPublicar = sp?.get("from") === "publicar";
  const [draft, setDraft] = useState<EmpleosFeriaDraft | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(EMPLEOS_SESSION_KEYS.feria);
      if (!raw) setDraft(null);
      else {
        const parsed = JSON.parse(raw) as Partial<EmpleosFeriaDraft>;
        setDraft(normalizeEmpleosFeriaDraft(parsed));
      }
    } catch {
      setDraft(null);
    } finally {
      setReady(true);
    }
  }, []);

  const editHref = appendLangToPath(EMPLEOS_PUBLISH_ROUTES.feria, lang);
  const backLabel = lang === "en" ? "Back to edit" : "Volver a editar";
  const prevCopy = EMPLEOS_PUBLISH_SHARED_COPY[lang].previewNoDraft;

  if (!ready) {
    return <div className="min-h-screen bg-[#ECEAE7]" aria-busy="true" />;
  }

  if (fromPublicar && !draft) {
    return (
      <div className="min-h-screen bg-[#ECEAE7] px-4 py-10 text-center text-sm text-[color:var(--lx-text-2)]">
        <p>{prevCopy.message}</p>
        <Link href={editHref} className="mt-4 inline-block font-semibold text-[#2563EB] underline">
          {prevCopy.backLink}
        </Link>
      </div>
    );
  }

  if (fromPublicar && draft) {
    const data = mapFeriaDraftToShell(draft);
    return (
      <LeonixPreviewPageShell
        editHref={editHref}
        backLabel={backLabel}
        onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      >
        <EmpleoJobFairDetailPage data={data} withSiteChrome={false} />
      </LeonixPreviewPageShell>
    );
  }

  return <EmpleoJobFairDetailPage />;
}
