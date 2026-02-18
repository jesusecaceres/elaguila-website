"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Lang = "es" | "en";

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

function detectLangFromRedirect(redirect: string): Lang {
  try {
    const u = new URL(redirect, "https://example.com");
    const l = u.searchParams.get("lang");
    if (l === "es" || l === "en") return l;
  } catch {
    // ignore
  }
  return "es";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams?.get("redirect");
  const redirectTo = useMemo(() => {
    const safe = safeInternalRedirect(redirectParam);
    return safe || "/home?lang=es";
  }, [redirectParam]);

  const lang = useMemo(() => detectLangFromRedirect(redirectTo), [redirectTo]);

  const [status, setStatus] = useState<"working" | "error">("working");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function run() {
      try {
        // In PKCE flow, Supabase returns a `code` query param.
        const code = searchParams?.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }
        }

        // If there is no code, it may already have a session (magic link) — just proceed.
        router.replace(redirectTo);
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e?.message ?? "Unknown error");
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-yellow-600/20 bg-black/40 p-6 text-center">
        {status === "working" ? (
          <>
            <div className="text-yellow-400 font-semibold text-lg">
              {lang === "es" ? "Entrando…" : "Signing you in…"}
            </div>
            <p className="text-gray-300 mt-2">
              {lang === "es"
                ? "Estamos finalizando tu sesión y regresándote al sitio."
                : "Finalizing your session and sending you back."}
            </p>
          </>
        ) : (
          <>
            <div className="text-yellow-400 font-semibold text-lg">
              {lang === "es" ? "Hubo un problema" : "Something went wrong"}
            </div>
            <p className="text-gray-300 mt-2">
              {errorMsg ||
                (lang === "es"
                  ? "No pudimos completar el inicio de sesión."
                  : "We couldn’t complete sign-in.")}
            </p>

            <button
              onClick={() => router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`)}
              className="mt-6 w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold py-3"
            >
              {lang === "es" ? "Volver a intentar" : "Try again"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
