"use client";

import type { ReactNode } from "react";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosClasificadosPreviewChrome } from "@/app/clasificados/autos/shared/components/AutosClasificadosPreviewChrome";

export { AUTO_DEALER_PREVIEW_PAGE_BG } from "@/app/clasificados/autos/shared/components/autosPreviewChromeBg";

/** Negocios lane — uses shared Autos preview chrome. */
export function AutoDealerPreviewChrome({
  editBackHref,
  showSiteLogo,
  hideBackToEdit,
  children,
}: {
  editBackHref?: string;
  showSiteLogo?: boolean;
  hideBackToEdit?: boolean;
  children: ReactNode;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
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
      showSiteLogo={showSiteLogo}
      hideBackToEdit={hideBackToEdit}
    >
      {children}
    </AutosClasificadosPreviewChrome>
  );
}
