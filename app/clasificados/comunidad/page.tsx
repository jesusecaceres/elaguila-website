"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

const CATEGORY = "comunidad";

const COPY = {
  es: {
    title: "Comunidad",
    line1: "Te estamos llevando a los anuncios de esta categoría.",
    line2: "Si no te redirige automáticamente, usa el botón:",
    button: "Ver anuncios",
  },
  en: {
    title: "Community",
    line1: "Taking you to listings in this category.",
    line2: "If you aren’t redirected automatically, use this button:",
    button: "View listings",
  },
} as const;

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = useMemo<Lang>(() => {
    const v = sp?.get("lang");
    return v === "en" ? "en" : "es";
  }, [sp]);

  const href = useMemo(() => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // Force category to unified engine (canonical results)
    params.set("cat", CATEGORY);
    // Backward-compatible: also set "category" if something else still reads it
    params.set("category", CATEGORY);
    return "/clasificados/lista?" + params.toString();
  }, [sp]);

  const postHref = useMemo(() => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    params.set("lang", lang);
    params.set("cat", CATEGORY);
    params.set("category", CATEGORY);
    return "/clasificados/publicar?" + params.toString();
  }, [sp, lang]);

  const membershipsHref = useMemo(() => {
    return `/clasificados?lang=${lang}#memberships`;
  }, [lang]);

useEffect(() => {
    router.replace(href);
  }, [router, href]);

  const t = COPY[lang];

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border border-yellow-600/30 bg-black/40 flex items-center justify-center">
          <span className="text-yellow-400 text-lg">↗</span>
        </div>

        <h1 className="text-2xl font-semibold text-yellow-400">{t.title}</h1>
        <p className="mt-3 text-sm text-gray-300 leading-relaxed">{t.line1}</p>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{t.line2}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 transition"
          >
            {t.button}
          </Link>

          <Link
            href={"/clasificados?lang=" + lang}
            className="inline-flex items-center justify-center rounded-xl border border-yellow-600/30 bg-black/40 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-black/60 transition"
          >
            {lang === "es" ? "Volver" : "Back"}
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          {lang === "es"
            ? "LEONIX mantiene una sola lista canónica para SEO y consistencia."
            : "LEONIX keeps one canonical results engine for SEO and consistency."}
        </p>
      </div>
    </div>
  );
}
