"use client";

import { useSearchParams } from "next/navigation";

export default function AboutPage() {
  const searchParams = useSearchParams()!;

  const lang =
    (searchParams?.get("lang") === "en" ? "en" : "es") as "es" | "en";

  const t = {
    es: {
      title: "Sobre El Águila",
      body: "Contenido en español",
    },
    en: {
      title: "About El Águila",
      body: "English content",
    },
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="text-3xl font-bold mb-4">{t[lang].title}</h1>
      <p className="text-gray-300">{t[lang].body}</p>
    </main>
  );
}
