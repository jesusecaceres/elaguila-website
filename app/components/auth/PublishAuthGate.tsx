"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildPublishLoginHref,
  detectLangFromPath,
  type PublishLang,
} from "@/app/lib/auth/publishLoginRedirect";
import {
  AUTH_CHECK_TIMEOUT_MS,
  createSupabaseBrowserClient,
  withAuthTimeout,
} from "@/app/lib/supabase/browser";

type GateStatus = "checking" | "authed" | "redirecting";

export function PublishAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GateStatus>("checking");

  const returnPath = useMemo(() => {
    const q = searchParams?.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  const lang: PublishLang = useMemo(() => {
    const urlLang = searchParams?.get("lang");
    if (urlLang === "en") return "en";
    if (urlLang === "es") return "es";
    return detectLangFromPath(returnPath);
  }, [searchParams, returnPath]);

  const loginHref = useMemo(() => buildPublishLoginHref(returnPath, lang), [returnPath, lang]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data: sess } = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        if (!cancelled && sess.session?.user) {
          setStatus("authed");
          return;
        }
        const { data: userData } = await withAuthTimeout(sb.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
        if (!cancelled && userData.user) {
          setStatus("authed");
          return;
        }
      } catch {
        // Unavailable or timed out — treat as logged out and send to login.
      }

      if (cancelled) return;
      setStatus("redirecting");
      window.location.replace(loginHref);
    })();

    return () => {
      cancelled = true;
    };
  }, [loginHref]);

  if (status === "authed") {
    return <>{children}</>;
  }

  const message =
    status === "checking"
      ? lang === "en"
        ? "Checking session…"
        : "Comprobando sesión…"
      : lang === "en"
        ? "Sign in to publish your ad."
        : "Inicia sesión para publicar tu anuncio.";

  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 text-center text-sm text-[#3D3428]"
      role="status"
      aria-live="polite"
    >
      <p>{message}</p>
    </div>
  );
}
