"use client";

import { useSearchParams } from "next/navigation";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { useAutoPrivadoDraft } from "../hooks/useAutoPrivadoDraft";
import { AutosPublishConfirmCore } from "../../shared/components/AutosPublishConfirmCore";

export function AutosPrivadoPublishConfirm() {
  const sp = useSearchParams();
  const lang = (sp ?? new URLSearchParams()).get("lang") === "en" ? "en" : "es";
  const { hydrated, listing, flushDraft } = useAutoPrivadoDraft();
  const editHref = withLangParam("/publicar/autos/privado", lang);

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-20 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.16), transparent 55%)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
        <AutosPublishConfirmCore
          lane="privado"
          lang={lang}
          listing={listing}
          hydrated={hydrated}
          flushDraft={flushDraft}
          editHref={editHref}
        />
      </div>
    </div>
  );
}
