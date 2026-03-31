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
    <main className="max-w-4xl mx-auto px-6 pt-28 pb-16 text-[color:var(--lx-text)]">
      <div className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-8 shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
        <h1 className="text-3xl font-bold mb-3">{t[lang].title}</h1>
        <p className="text-[color:var(--lx-text-2)]/90">{t[lang].body}</p>
      </div>
    </main>
  );
}
