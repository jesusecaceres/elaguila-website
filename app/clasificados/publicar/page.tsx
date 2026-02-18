"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

export default function PublicarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const redirectForLogin = useMemo(() => {
    // Always come back here with the current querystring.
    const qs = searchParams?.toString() ?? "";
    const here = qs ? `/clasificados/publicar?${qs}` : `/clasificados/publicar?lang=${lang}`;
    return safeInternalRedirect(here) || `/clasificados/publicar?lang=${lang}`;
  }, [lang, searchParams]);

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const next = `/login?redirect=${encodeURIComponent(redirectForLogin)}`;
        router.replace(next);
        return;
      }

      setSignedIn(true);
      setChecking(false);
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router, redirectForLogin]);

  const copy = useMemo(
    () => ({
      es: {
        title: "Publicar anuncio",
        subtitle:
          "Ya estás dentro. Este es el inicio del flujo de publicación (formulario completo en la siguiente fase).",
        cta1: "Ir a mi cuenta",
        cta2: "Ver clasificados",
      },
      en: {
        title: "Post an ad",
        subtitle:
          "You’re signed in. This is the start of the posting flow (full form in the next phase).",
        cta1: "Go to my account",
        cta2: "Browse classifieds",
      },
    }),
    []
  )[lang];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="rounded-2xl border border-yellow-600/20 bg-black/40 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400 text-center">
            {copy.title}
          </h1>

          <p className="text-gray-300 text-center mt-3 max-w-2xl mx-auto">
            {checking
              ? lang === "es"
                ? "Verificando sesión…"
                : "Checking session…"
              : copy.subtitle}
          </p>

          {signedIn && !checking && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/dashboard?lang=${lang}`)}
                className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-6 py-3"
              >
                {copy.cta1}
              </button>
              <button
                onClick={() => router.push(`/clasificados?lang=${lang}`)}
                className="rounded-xl border border-white/10 bg-black/40 hover:bg-black/50 text-white font-semibold px-6 py-3"
              >
                {copy.cta2}
              </button>
            </div>
          )}

          <div className="mt-8 text-xs text-white/40 text-center">
            {lang === "es"
              ? "Nota: Esta página ya está protegida por login y respeta el redirect exacto."
              : "Note: This page is now protected by login and respects the exact redirect."}
          </div>
        </div>
      </div>
    </main>
  );
}
