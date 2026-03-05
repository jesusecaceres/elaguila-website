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

function stripHashFromUrl() {
  try {
    const clean = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", clean);
  } catch {
    // ignore
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams?.get("redirect");
  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const redirectTo = useMemo(() => {
    const safe = safeInternalRedirect(redirectParam);
    return safe || "/dashboard?lang=es";
  }, [redirectParam]);

  const redirectLang = useMemo(() => detectLangFromRedirect(redirectTo), [redirectTo]);

  const [status, setStatus] = useState<"working" | "error">("working");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function finalizeSessionFromUrl() {
      const code = searchParams?.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        return;
      }

      const hash = window.location.hash?.replace(/^#/, "") ?? "";
      if (!hash) return;

      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      stripHashFromUrl();

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) throw error;
      }
    }

    async function decideWhereToGo() {
      const { data } = await supabase.auth.getUser();
      const u = data.user;

      if (!u) {
        const r = encodeURIComponent(redirectTo);
        router.replace(`/login?redirect=${r}`);
        return;
      }

      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      const hasName = Boolean(
        (meta.full_name as string)?.trim() || (meta.name as string)?.trim()
      );

      const safeRedirect = safeInternalRedirect(redirectParam);
      const isRequirePost = safeRedirect && safeRedirect.includes("require=post");

      if (isRequirePost) {
        router.replace(redirectTo);
        return;
      }

      if (safeRedirect) {
        router.replace(redirectTo);
        return;
      }

      if (hasName) {
        router.replace(`/clasificados?lang=${redirectLang}`);
        return;
      }

      router.replace(`/dashboard/perfil?onboarding=1&lang=${redirectLang}`);
    }

    async function run() {
      try {
        await finalizeSessionFromUrl();
        await decideWhereToGo();
      } catch (e: unknown) {
        stripHashFromUrl();
        setStatus("error");
        setErrorMsg((e as { message?: string })?.message ?? "Unknown error");
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const langDisplay = redirectTo ? redirectLang : lang;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-yellow-600/20 bg-black/40 p-6 text-center">
        {status === "working" ? (
          <>
            <div className="text-yellow-400 font-semibold text-lg">
              {langDisplay === "es" ? "Entrando…" : "Signing you in…"}
            </div>
            <p className="text-gray-300 mt-2">
              {langDisplay === "es"
                ? "Estamos finalizando tu sesión y regresándote al sitio."
                : "Finalizing your session and sending you back."}
            </p>
          </>
        ) : (
          <>
            <div className="text-yellow-400 font-semibold text-lg">
              {langDisplay === "es" ? "Hubo un problema" : "Something went wrong"}
            </div>
            <p className="text-gray-300 mt-2">
              {errorMsg ||
                (langDisplay === "es"
                  ? "No pudimos completar el inicio de sesión."
                  : "We couldn't complete sign-in.")}
            </p>

            <button
              onClick={() =>
                router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`)
              }
              className="mt-6 w-full rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold py-3"
            >
              {langDisplay === "es" ? "Volver a intentar" : "Try again"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
