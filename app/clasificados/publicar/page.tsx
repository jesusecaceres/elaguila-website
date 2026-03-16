"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";

/**
 * Lightweight auth gate for /clasificados/publicar.
 * Logged-out users go straight to login (mode=post); logged-in users proceed into the publish flow.
 * Prevents unauthenticated users from landing on [category] and getting stuck on "Verificando sesión…".
 */
export default function PublicarRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams?.get("lang") ?? "es";
    const qs = searchParams?.toString() ?? "";
    const queryString = qs ? `?${qs}` : `?lang=${lang}`;
    const publicarUrl = `/clasificados/publicar/en-venta${queryString}`;
    const loginUrl = `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(publicarUrl)}`;

    let mounted = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await withAuthTimeout(
          supabase.auth.getSession(),
          AUTH_CHECK_TIMEOUT_MS
        );
        if (!mounted) return;
        if (session?.user) {
          router.replace(publicarUrl);
        } else {
          router.replace(loginUrl);
        }
      } catch {
        if (!mounted) return;
        router.replace(loginUrl);
      }
    })();
    return () => { mounted = false; };
  }, [router, searchParams]);

  return null;
}
