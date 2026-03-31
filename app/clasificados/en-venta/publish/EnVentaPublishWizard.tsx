"use client";

import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";

const PREVIEW_CTA = {
  es: {
    title: "Antes de publicar, revisa tu anuncio",
    body: "Mira cómo se verá tu anuncio antes de publicarlo y asegúrate de que toda la información esté correcta.",
    freeBtn: "Vista previa gratis",
    proBtn: "Vista previa Pro",
    aria: "Vista previa antes de publicar",
  },
  en: {
    title: "Before publishing, review your listing",
    body: "See how your listing will look before publishing and make sure all the information is correct.",
    freeBtn: "Free preview",
    proBtn: "Pro preview",
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
 * Preview call-to-action shown above the legal/rules confirmation block in En Venta publish flows.
 */
export function EnVentaPreviewBeforePublishCta({ lang, variant = "light", onBeforePreview }: Props) {
  const t = PREVIEW_CTA[lang];
  const freeHref = `${PREVIEW_HREF_BASE}?lang=${lang}&plan=free`;
  const proHref = `${PREVIEW_HREF_BASE}?lang=${lang}&plan=pro`;

  function goPreview(plan: "free" | "pro", href: string) {
    onBeforePreview?.(plan);
    markPublishFlowOpeningPreview();
    window.location.assign(href);
  }

  const shell =
    variant === "dark"
      ? "rounded-2xl border border-[#C9B46A]/28 bg-[#141414] p-5 shadow-md ring-1 ring-[#C9B46A]/12"
      : "rounded-2xl border border-black/10 bg-[#FAFAFA] p-5 shadow-sm ring-1 ring-[#C9B46A]/18";

  const titleCls =
    variant === "dark" ? "text-lg font-bold tracking-tight text-white" : "text-lg font-bold tracking-tight text-[#111111]";
  const bodyCls = variant === "dark" ? "mt-2 text-sm leading-relaxed text-white/72" : "mt-2 text-sm leading-relaxed text-[#111111]/75";

  const freeBtn =
    variant === "dark"
      ? "inline-flex flex-1 min-w-[10rem] items-center justify-center rounded-xl border border-white/18 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
      : "inline-flex flex-1 min-w-[10rem] items-center justify-center rounded-xl border border-black/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] transition hover:bg-[#F3F3F3]";

  const proBtn =
    variant === "dark"
      ? "inline-flex flex-1 min-w-[10rem] items-center justify-center rounded-xl border border-[#C9B46A]/45 bg-[#C9B46A]/12 px-4 py-2.5 text-sm font-semibold text-[#E4D4A8] transition hover:bg-[#C9B46A]/22"
      : "inline-flex flex-1 min-w-[10rem] items-center justify-center rounded-xl border border-[#111111] bg-[#111111] px-4 py-2.5 text-sm font-semibold text-[#F5F5F5] transition hover:bg-black";

  return (
    <div className={shell} role="region" aria-label={t.aria}>
      <h2 className={titleCls}>{t.title}</h2>
      <p className={bodyCls}>{t.body}</p>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
        <a
          href={freeHref}
          className={freeBtn}
          onClick={(e) => {
            e.preventDefault();
            goPreview("free", freeHref);
          }}
        >
          {t.freeBtn}
        </a>
        <a
          href={proHref}
          className={proBtn}
          onClick={(e) => {
            e.preventDefault();
            goPreview("pro", proHref);
          }}
        >
          {t.proBtn}
        </a>
      </div>
    </div>
  );
}

export default EnVentaPreviewBeforePublishCta;
