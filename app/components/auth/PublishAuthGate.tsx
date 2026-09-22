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
import { ConciergeReturnBanner } from "@/app/components/business/ConciergeReturnBanner";
import { AssistedPublishingUiProvider } from "@/app/components/auth/AssistedPublishingUiContext";
import { LeonixManagedModeBanner } from "@/app/components/auth/LeonixManagedModeBanner";

type GateStatus = "checking" | "authed" | "redirecting";

/** Server-verified result of app/lib/auth/assistedPublishingSession.ts, passed down from the
 * Server Component wrapper (PublishAuthGateLayout) — never computed or trusted client-side. */
type AssistedProp = { businessId: string; category: string; listingId?: string | null } | null;

export function PublishAuthGate({
  children,
  assisted = null,
}: {
  children: React.ReactNode;
  assisted?: AssistedProp;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GateStatus>(assisted ? "authed" : "checking");

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
    // P0 Staff-Assisted Category Access — a server-verified assisted context is already proof of
    // authorization (real HMAC signature check happened server-side in PublishAuthGateLayout);
    // never re-run or fall back to the customer Supabase check when it's present, and never make
    // a network call to prove something the server already proved.
    if (assisted) {
      setStatus("authed");
      return;
    }

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
  }, [assisted, loginHref]);

  if (status === "authed") {
    // Only rendered for a server-verified assisted session (never for a real customer — the
    // banner itself independently self-guards via its own sessionStorage check too, so this is
    // defense in depth, not the only thing preventing it from ever showing to a customer).
    return (
      <AssistedPublishingUiProvider value={assisted}>
        {/* QUICK SALES ENTRY CONSOLIDATION — persistent, unconditional under a verified assisted
            context. ConciergeReturnBanner below still self-guards on its sessionStorage context
            and stays for the Create-for-Client handoff's "back to business" affordance. */}
        {assisted ? <LeonixManagedModeBanner businessId={assisted.businessId} category={assisted.category} listingId={assisted.listingId ?? null} /> : null}
        {assisted ? <ConciergeReturnBanner /> : null}
        {children}
      </AssistedPublishingUiProvider>
    );
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
