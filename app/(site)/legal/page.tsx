"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Información Legal",
    body: "Bienvenido a Leonix Media. Esta página enlaza nuestras políticas públicas. El contenido legal completo puede actualizarse; no sustituye asesoría legal profesional.",
    privacy: "Política de privacidad",
    terms: "Términos de servicio",
    dataDeletion: "Eliminación de datos",
    reglas: "Reglas del marketplace (Clasificados)",
    contact: "Contacto general",
  },
  en: {
    title: "Legal Information",
    body: "Welcome to Leonix Media. This page links our public policies. Full legal text may be updated; it is not a substitute for professional legal advice.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    dataDeletion: "Data Deletion Instructions",
    reglas: "Marketplace rules (Clasificados)",
    contact: "General contact",
  },
} as const;

function LegalPageInner() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const t = COPY[lang];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto pt-28 pb-20 px-6">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">
          {t.title}
        </h1>

        <p className="text-lg leading-relaxed text-gray-300 mb-6">{t.body}</p>

        <ul className="space-y-3 text-base">
          <li>
            <a href={`/privacy?lang=${lang}`} className="font-semibold text-yellow-300 underline underline-offset-4 hover:text-yellow-200">
              {t.privacy}
            </a>
          </li>
          <li>
            <a href={`/terms?lang=${lang}`} className="font-semibold text-yellow-300 underline underline-offset-4 hover:text-yellow-200">
              {t.terms}
            </a>
          </li>
          <li>
            <a
              href={`/data-deletion?lang=${lang}`}
              className="font-semibold text-yellow-300 underline underline-offset-4 hover:text-yellow-200"
            >
              {t.dataDeletion}
            </a>
          </li>
          <li>
            <a
              href={`/clasificados/reglas?lang=${lang}`}
              className="font-semibold text-yellow-300 underline underline-offset-4 hover:text-yellow-200"
            >
              {t.reglas}
            </a>
          </li>
          <li>
            <a href={`/contacto?lang=${lang}`} className="font-semibold text-yellow-300 underline underline-offset-4 hover:text-yellow-200">
              {t.contact}
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={null}>
      <LegalPageInner />
    </Suspense>
  );
}
