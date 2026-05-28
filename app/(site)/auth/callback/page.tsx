"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  establishSessionFromAuthCallback,
  genericCallbackErrorMessage,
  isRecoveryAuthCallback,
  isRecoveryDestination,
  readAuthCallbackParams,
  stripAuthTokensFromUrl,
} from "@/app/lib/auth/authCallbackSession";
import {
  createSupabaseBrowserClient,
  waitForBrowserSession,
  withAuthTimeout,
} from "@/app/lib/supabase/browser";

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

function AuthCallbackContent() {
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

  const CALLBACK_TIMEOUT_MS = 12000;
  const SESSION_WAIT_MS = 8000;

  useEffect(() => {
    let cancelled = false;

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e) {
      setStatus("error");
      setErrorMsg((e as { message?: string })?.message ?? "Configuration error");
      return;
    }

    const { query, hash } = readAuthCallbackParams();
    const redirectFromUrl = safeInternalRedirect(
      query.get("redirect") ?? redirectParam
    );
    const destination =
      redirectFromUrl || redirectTo || `/dashboard?lang=${redirectLang}`;
    const recoveryFlow = isRecoveryAuthCallback(query, hash, destination);

    function redirectToLoginWithError(message: string, errorCode: string) {
      const q = new URLSearchParams();
      if (redirectFromUrl || redirectParam) {
        q.set("redirect", redirectFromUrl || redirectParam || destination);
      }
      q.set("auth_error", errorCode);
      router.replace(`/login?${q.toString()}`);
      if (!cancelled) {
        setStatus("error");
        setErrorMsg(message);
      }
    }

    async function decideWhereToGo() {
      const { session, user } = await waitForBrowserSession(
        supabase,
        SESSION_WAIT_MS
      );
      const u = user ?? session?.user ?? null;

      if (!u) {
        redirectToLoginWithError(
          genericCallbackErrorMessage(redirectLang),
          recoveryFlow ? "recovery" : "callback"
        );
        return;
      }

      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      const hasName = Boolean(
        (meta.full_name as string)?.trim() || (meta.name as string)?.trim()
      );

      const safeRedirect = redirectFromUrl || safeInternalRedirect(redirectParam);
      const isRequirePost = safeRedirect && safeRedirect.includes("require=post");

      if (isRequirePost || safeRedirect) {
        router.replace(destination);
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
        await withAuthTimeout(
          (async () => {
            await establishSessionFromAuthCallback(supabase, destination);
            await decideWhereToGo();
          })(),
          CALLBACK_TIMEOUT_MS
        );
      } catch (e: unknown) {
        stripAuthTokensFromUrl();
        const msg = (e as { message?: string })?.message;
        const safeMessage = genericCallbackErrorMessage(redirectLang, msg);
        redirectToLoginWithError(
          safeMessage,
          recoveryFlow || isRecoveryDestination(destination) ? "recovery" : "callback"
        );
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [redirectParam, redirectTo, redirectLang, router]);

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
              onClick={() => {
                const q = new URLSearchParams();
                q.set("redirect", redirectTo);
                router.replace(`/login?${q.toString()}`);
              }}
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

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="text-yellow-400 font-semibold text-lg">…</div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
