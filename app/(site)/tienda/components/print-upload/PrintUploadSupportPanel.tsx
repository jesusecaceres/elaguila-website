"use client";

import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { tiendaPublicContactPath, withLang } from "../../utils/tiendaRouting";
import { printUploadBuilderCopy, puPick } from "../../data/printUploadBuilderCopy";

export function PrintUploadSupportPanel(props: { lang: Lang }) {
  const { lang } = props;
  return (
    <section className="rounded-2xl border border-[rgba(201,168,74,0.26)] bg-[linear-gradient(180deg,rgba(201,168,74,0.10),rgba(0,0,0,0.18))] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">
        {lang === "en" ? "Need help or a custom quote?" : "¿Ayuda o cotización personalizada?"}
      </h2>
      <p className="mt-2 text-sm text-[rgba(255,255,255,0.76)] leading-relaxed">
        {lang === "en"
          ? "Unsure if your file is print‑ready, or need design support? Leonix can review or build it with you."
          : "¿Dudas si tu archivo está listo o necesitas diseño? Leonix puede revisarlo o apoyarte."}
      </p>
      <p className="mt-2 text-xs text-[rgba(255,255,255,0.62)] leading-relaxed">
        {puPick(printUploadBuilderCopy.bleedMarginsNote, lang)}
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <Link
          href={withLang(tiendaPublicContactPath(), lang)}
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition"
        >
          {puPick({ es: "Contactar Leonix", en: "Contact Leonix" }, lang)}
        </Link>
        <span className="text-xs text-[rgba(255,255,255,0.62)] sm:self-center">
          {lang === "en" ? "Visit our office for complex jobs." : "Visita la oficina para trabajos complejos."}
        </span>
      </div>
    </section>
  );
}
