"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

export default function TravelCategoryPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = (sp?.get("lang") === "en" ? "en" : "es") as Lang;

  const targetHref = useMemo(() => {
    const next = new URLSearchParams();

    // Preserve existing params (future-proof: location, radius, search, etc.)
    if (sp) {
      sp.forEach((value, key) => {
        if (typeof value === "string" && value.length > 0) next.set(key, value);
      });
    }

    next.set("lang", lang);
    next.set("cat", "travel");

    return `/clasificados/lista?${next.toString()}`;
  }, [lang, sp]);

  useEffect(() => {
    router.replace(targetHref);
  }, [router, targetHref]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <div className="text-yellow-400 text-2xl font-extrabold">
          {lang === "en" ? "Travel" : "Viajes"}
        </div>
        <div className="mt-2 text-gray-300">
          {lang === "en"
            ? "Redirecting to listings…"
            : "Redirigiendo a los anuncios…"}
        </div>

        <a
          href={targetHref}
          className="inline-flex mt-6 items-center justify-center px-5 py-3 rounded-xl border border-yellow-400/30 bg-black/40 text-white font-semibold hover:bg-black/55 transition"
        >
          {lang === "en" ? "Open Travel listings" : "Ver anuncios de Viajes"}
        </a>
      </div>
    </div>
  );
}
