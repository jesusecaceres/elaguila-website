"use client";

import { useRouter } from "next/navigation";
import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { hasEnVentaPreviewDraft } from "../preview/enVentaPreviewDraft";
import { enVentaPublicLabel } from "../shared/constants/enVentaPublicLabels";

const PREVIEW_CTA = {
  es: {
    title: "Antes de publicar, revisa tu anuncio",
    body: "Mira cómo se verá tu anuncio antes de publicarlo y asegúrate de que toda la información esté correcta.",
    previewBtn: "Vista previa del anuncio",
    aria: "Vista previa antes de publicar",
    includedNote: "incluido sin costo",
  },
  en: {
    title: "Before publishing, review your listing",
    body: "See how your listing will look before publishing and make sure all the information is correct.",
    previewBtn: "Listing preview",
    aria: "Preview before publishing",
    includedNote: "included at no charge",
  },
} as const;

const PREVIEW_HREF_BASE = "/clasificados/en-venta/preview";

export type EnVentaPreviewCtaVariant = "light" | "dark";

type Props = {
  lang: "es" | "en";
  variant?: EnVentaPreviewCtaVariant;
  /** Runs synchronously before navigation; must persist preview draft (throws on family-safety block). */
  onBeforePreview?: (plan: "free" | "pro") => void;
  /** Core-field blockers; preview allowed when empty. Checkboxes not required. */
  previewBlockers?: string[];
};

/**
 * Preview call-to-action shown above the legal/rules confirmation block in Varios / For Sale publish flows.
 */
export function EnVentaPreviewBeforePublishCta({
  lang,
  variant = "light",
  onBeforePreview,
  previewBlockers = [],
}: Props) {
  const router = useRouter();
  const t = PREVIEW_CTA[lang];
  const proHref = `${PREVIEW_HREF_BASE}?lang=${lang}&plan=pro`;

  function goPreview() {
    if (previewBlockers.length > 0) return;
    try {
      onBeforePreview?.("pro");
    } catch {
      return;
    }
    if (!hasEnVentaPreviewDraft("pro")) {
      return;
    }
    markPublishFlowOpeningPreview();
    router.push(proHref);
  }

  const shell =
    variant === "dark"
      ? "rounded-2xl border border-[#C9B46A]/28 bg-[#141414] p-5 shadow-md ring-1 ring-[#C9B46A]/12"
      : "rounded-2xl border border-black/10 bg-[#FAFAFA] p-5 shadow-sm ring-1 ring-[#C9B46A]/18";

  const titleCls =
    variant === "dark" ? "text-lg font-bold tracking-tight text-white" : "text-lg font-bold tracking-tight text-[#111111]";
  const bodyCls =
    variant === "dark" ? "mt-2 text-sm leading-relaxed text-white/72" : "mt-2 text-sm leading-relaxed text-[#111111]/75";

  const previewBtn =
    variant === "dark"
      ? "inline-flex w-full items-center justify-center rounded-xl border border-[#C9B46A]/45 bg-[#C9B46A]/12 px-4 py-2.5 text-sm font-semibold text-[#E4D4A8] transition hover:bg-[#C9B46A]/22"
      : "inline-flex w-full items-center justify-center rounded-xl border border-[#111111] bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] transition hover:bg-black";

  return (
    <div className={shell} role="region" aria-label={t.aria}>
      <h2 className={titleCls}>{t.title}</h2>
      <p className={bodyCls}>{t.body}</p>
      <p className="mt-1 text-xs text-[#5D4A25]/75">
        {enVentaPublicLabel(lang)} · {t.includedNote}
      </p>
      {previewBlockers.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <p className="font-semibold">
            {lang === "es" ? "Para ver la vista previa, completa:" : "To open preview, complete:"}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-snug">
            {previewBlockers.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          className={previewBtn}
          onClick={goPreview}
          disabled={previewBlockers.length > 0}
        >
          {t.previewBtn}
        </button>
      </div>
    </div>
  );
}

export default EnVentaPreviewBeforePublishCta;
