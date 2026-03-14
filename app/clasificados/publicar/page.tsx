"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

/**
 * Pure redirect gate for /clasificados/publicar.
 * No UI. On mount: check auth → if not authenticated go to login (mode=post);
 * if authenticated go to real publish flow (category-select).
 */
export default function PublicarRootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString() ?? "";
    const queryString = qs ? `?${qs}` : "";
    const currentPathWithQuery = `${pathname ?? "/clasificados/publicar"}${queryString}`;
    const lang = searchParams?.get("lang") ?? "es";
    const publishFlowPath = `/clasificados/publicar/en-venta${queryString || `?lang=${lang}`}`;

    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      router.replace(publishFlowPath);
      return;
    }

    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        const redirect = encodeURIComponent(currentPathWithQuery);
        router.replace(`/login?mode=post&lang=${lang}&redirect=${redirect}`);
        return;
      }
      router.replace(publishFlowPath);
    }).catch(() => {
      if (!mounted) return;
      const redirect = encodeURIComponent(currentPathWithQuery);
      router.replace(`/login?mode=post&lang=${lang}&redirect=${redirect}`);
    });

    return () => { mounted = false; };
  }, [router, pathname, searchParams]);

  return null;
}
