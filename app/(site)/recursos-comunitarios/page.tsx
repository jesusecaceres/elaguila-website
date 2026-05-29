"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RecursosComunitariosInner() {
  const lang = useSearchParams()?.get("lang") === "en" ? "en" : "es";
  const title = lang === "es" ? "Recursos Comunitarios" : "Community Resources";
  const body =
    lang === "es"
      ? "Próximamente. Estamos preparando este espacio para compartir recursos útiles para nuestra comunidad."
      : "Coming soon. We are preparing this space to share helpful resources for our community.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-28 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-[#2A4536]">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-[#3D3428]">{body}</p>
    </main>
  );
}

export default function RecursosComunitariosPage() {
  return (
    <Suspense fallback={null}>
      <RecursosComunitariosInner />
    </Suspense>
  );
}
