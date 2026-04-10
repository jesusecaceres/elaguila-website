"use client";

import { useSearchParams } from "next/navigation";
import { withAutosEditorResumeFromPreview } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { useAutoDealerDraft } from "../hooks/useAutoDealerDraft";
import { AutosPublishConfirmCore } from "../../shared/components/AutosPublishConfirmCore";

export function AutosNegociosPublishConfirm() {
  const sp = useSearchParams();
  const lang = (sp ?? new URLSearchParams()).get("lang") === "en" ? "en" : "es";
  const { hydrated, listing, flushDraft } = useAutoDealerDraft();
  const editHref = withAutosEditorResumeFromPreview("/publicar/autos/negocios", lang);

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
          lane="negocios"
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
