"use client";

import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { enVentaPublicProLabel } from "../shared/constants/enVentaPublicLabels";

const PREVIEW_CTA = {
  es: {
    title: "Antes de publicar, revisa tu anuncio",
    body: "Mira cómo se verá tu anuncio Pro antes de publicarlo y asegúrate de que toda la información esté correcta.",
    proBtn: "Vista previa del anuncio Pro",
    aria: "Vista previa antes de publicar",
  },
  en: {
    title: "Before publishing, review your listing",
    body: "See how your Pro listing will look before publishing and make sure all the information is correct.",
    proBtn: "Preview Pro listing",
    aria: "Preview before publishing",
  },
} as const;

const PREVIEW_HREF_BASE = "/clasificados/en-venta/preview";

export type EnVentaPreviewCtaVariant = "light" | "dark";

type Props = {
  lang: "es" | "en";
  variant?: EnVentaPreviewCtaVariant;
  /** Runs synchronously before full navigation; use to persist preview draft once (no background autosave). */
  onBeforePreview?: (plan: "free" | "pro") => void;
};

/**
 * Preview call-to-action shown above the legal/rules confirmation block in Varios / For Sale publish flows.
 */
export function EnVentaPreviewBeforePublishCta({ lang, variant = "light", onBeforePreview }: Props) {
  const t = PREVIEW_CTA[lang];
  const proHref = `${PREVIEW_HREF_BASE}?lang=${lang}&plan=pro`;

  function goPreview() {
    onBeforePreview?.("pro");
    markPublishFlowOpeningPreview();
    window.location.assign(proHref);
  }

  const shell =
    variant === "dark"
      ? "rounded-2xl border border-[#C9B46A]/28 bg-[#141414] p-5 shadow-md ring-1 ring-[#C9B46A]/12"
      : "rounded-2xl border border-black/10 bg-[#FAFAFA] p-5 shadow-sm ring-1 ring-[#C9B46A]/18";

  const titleCls =
    variant === "dark" ? "text-lg font-bold tracking-tight text-white" : "text-lg font-bold tracking-tight text-[#111111]";
  const bodyCls = variant === "dark" ? "mt-2 text-sm leading-relaxed text-white/72" : "mt-2 text-sm leading-relaxed text-[#111111]/75";

  const proBtn =
    variant === "dark"
      ? "inline-flex w-full items-center justify-center rounded-xl border border-[#C9B46A]/45 bg-[#C9B46A]/12 px-4 py-2.5 text-sm font-semibold text-[#E4D4A8] transition hover:bg-[#C9B46A]/22"
      : "inline-flex w-full items-center justify-center rounded-xl border border-[#111111] bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] transition hover:bg-black";

  return (
    <div className={shell} role="region" aria-label={t.aria}>
      <h2 className={titleCls}>{t.title}</h2>
      <p className={bodyCls}>{t.body}</p>
      <p className="mt-1 text-xs text-[#5D4A25]/75">
        {lang === "es" ? enVentaPublicProLabel("es") : enVentaPublicProLabel("en")} ·{" "}
        {lang === "es" ? "incluido sin costo" : "included at no charge"}
      </p>
      <div className="mt-4">
        <a
          href={proHref}
          className={proBtn}
          onClick={(e) => {
            e.preventDefault();
            goPreview();
          }}
        >
          {t.proBtn}
        </a>
      </div>
    </div>
  );
}

export default EnVentaPreviewBeforePublishCta;
