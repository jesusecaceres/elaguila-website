"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BuscoShellLayout } from "@/app/(site)/clasificados/busco/shared/BuscoShellLayout";
import {
  BUSCO_PRODUCT,
  buscoLangFromSearchParams,
  buscoPathWithLang,
} from "@/app/(site)/clasificados/busco/shared/buscoShellCopy";

const COPY = {
  es: {
    gateTitle: "Formulario en la siguiente fase",
    gateBody:
      "Aquí irá el formulario rápido: tipo de búsqueda, título, descripción, ciudad, contacto y una imagen opcional. Sin redes sociales, sitio web ni pagos.",
    previewCta: "Ir a vista previa (shell)",
    backLanding: "Volver a Busco / Se busca",
    comingLabel: "C3 — formulario completo",
  },
  en: {
    gateTitle: "Form coming in the next phase",
    gateBody:
      "The quick form will go here: request type, title, description, city, contact, and one optional image. No social handles, website, or payments.",
    previewCta: "Go to preview (shell)",
    backLanding: "Back to Looking for / Wanted",
    comingLabel: "C3 — full form",
  },
} as const;

type Mode = "quick" | "preview";

const PREVIEW_COPY = {
  es: {
    gateTitle: "Vista previa (shell)",
    gateBody:
      "La vista previa mostrará: título, tipo, ciudad/zona, Leonix Ad ID, imagen opcional, descripción breve y tarjeta de contacto. La publicación llegará en C4.",
    backQuick: "Volver al formulario (shell)",
    placeholderCard: "Tarjeta de solicitud — ejemplo vacío",
    placeholderType: "Tipo de búsqueda",
    placeholderCity: "Ciudad · zona",
    placeholderId: "Leonix Ad ID: LNX-XXXXXXXX",
    placeholderDesc: "Descripción breve de la solicitud…",
    placeholderContact: "Contacto: llamar · WhatsApp · texto · email",
  },
  en: {
    gateTitle: "Preview (shell)",
    gateBody:
      "Preview will show: title, type, city/zone, Leonix Ad ID, optional image, short description, and contact card. Publishing arrives in C4.",
    backQuick: "Back to form (shell)",
    placeholderCard: "Request card — empty sample",
    placeholderType: "Request type",
    placeholderCity: "City · zone",
    placeholderId: "Leonix Ad ID: LNX-XXXXXXXX",
    placeholderDesc: "Short description of the request…",
    placeholderContact: "Contact: call · WhatsApp · text · email",
  },
} as const;

export default function BuscoQuickShellClient({ mode }: { mode: Mode }) {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = mode === "preview" ? PREVIEW_COPY[lang] : COPY[lang];
  const landingHref = buscoPathWithLang("/clasificados/busco", lang);
  const quickHref = buscoPathWithLang("/publicar/busco/quick", lang);
  const previewHref = buscoPathWithLang("/publicar/busco/quick/preview", lang);

  return (
    <BuscoShellLayout
      lang={lang}
      backHref={mode === "preview" ? quickHref : landingHref}
      backLabel={mode === "preview" ? (PREVIEW_COPY[lang].backQuick as string) : COPY[lang].backLanding}
    >
      <div className="space-y-5">
        <span className="inline-flex rounded-full bg-[#E8F0FA] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1E3A5F]">
          {mode === "preview" ? (lang === "es" ? "C4 pendiente" : "C4 pending") : COPY[lang].comingLabel}
        </span>

        <section className="rounded-2xl border border-[#B8C8EA]/35 bg-[#FFFCF7] p-4 sm:p-5">
          <h2 className="text-lg font-bold text-[#1E1810]">{t.gateTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/90">{t.gateBody}</p>
          <p className="mt-3 text-xs font-medium text-[#3d4a5c]">{BUSCO_PRODUCT.notDatingNote[lang]}</p>
        </section>

        {mode === "preview" ? (
          <article className="overflow-hidden rounded-2xl border border-[#B8C8EA]/40 bg-white shadow-sm">
            <div className="flex aspect-[16/9] items-center justify-center bg-[#EDE8DF] text-xs font-semibold uppercase tracking-wide text-[#5C564E]/80">
              {lang === "es" ? "Imagen opcional" : "Optional image"}
            </div>
            <div className="space-y-2 p-4">
              <span className="inline-flex rounded-full bg-[#D7E3F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
                {(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderType}
              </span>
              <h3 className="text-lg font-bold text-[#1E1810]">
                {(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderCard}
              </h3>
              <p className="text-sm text-[#5C5346]">{(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderCity}</p>
              <p className="font-mono text-xs text-[#3d5a73]">
                {(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderId}
              </p>
              <p className="text-sm text-[#2a241c]/85">
                {(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderDesc}
              </p>
              <p className="rounded-xl border border-[#B8C8EA]/30 bg-[#F8FAFF] px-3 py-2.5 text-xs text-[#3d4a5c]">
                {(PREVIEW_COPY[lang] as (typeof PREVIEW_COPY)["es"]).placeholderContact}
              </p>
            </div>
          </article>
        ) : (
          <Link
            href={previewHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#B8C8EA]/55 bg-[#F0F4FF] px-5 py-3 text-sm font-semibold text-[#1E1810] transition hover:bg-[#E8F0FA] sm:w-auto"
          >
            {COPY[lang].previewCta}
          </Link>
        )}
      </div>
    </BuscoShellLayout>
  );
}
