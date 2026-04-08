"use client";

import type { ReactNode } from "react";
import { AutosClasificadosPreviewChrome } from "@/app/clasificados/autos/shared/components/AutosClasificadosPreviewChrome";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";

export function PrivadoPreviewChrome({ editBackHref, children }: { editBackHref?: string; children: ReactNode }) {
  const { lang, t } = useAutosPrivadoPreviewCopy();
  const c = t.preview.chrome;
  return (
    <AutosClasificadosPreviewChrome
      lang={lang}
      labels={{
        breadcrumbClassifieds: c.breadcrumbClassifieds,
        breadcrumbAutos: c.breadcrumbAutos,
        breadcrumbTail: c.breadcrumbDealers,
        backToEdit: c.backToEdit,
      }}
      editBackHref={editBackHref}
    >
      {children}
    </AutosClasificadosPreviewChrome>
  );
}
