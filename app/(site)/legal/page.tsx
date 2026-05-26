"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Información Legal",
    body: "Bienvenido a Leonix Media. Esta página contiene nuestra información legal general, incluyendo términos de uso, consideraciones de privacidad y nuestras pautas comunitarias.",
  },
  en: {
    title: "Legal Information",
    body: "Welcome to Leonix Media. This page contains our general legal information, including terms of use, privacy considerations, and our community guidelines.",
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

        <p className="text-lg leading-relaxed text-gray-300 mb-6">
          {t.body}
        </p>
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
