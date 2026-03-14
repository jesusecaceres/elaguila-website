"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export default function PublicarRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams?.get("lang") ?? "es";
    const query = lang ? `?lang=${lang}` : "";
    const targetPath = `/clasificados/publicar/en-venta${query}`;

    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      router.replace(targetPath);
      return;
    }

    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        const redirect = encodeURIComponent(targetPath);
        router.replace(`/login?mode=post&lang=${lang}&redirect=${redirect}`);
        return;
      }
      router.replace(targetPath);
    }).catch(() => {
      if (!mounted) return;
      const redirect = encodeURIComponent(targetPath);
      router.replace(`/login?mode=post&lang=${lang}&redirect=${redirect}`);
    });

    return () => { mounted = false; };
  }, [router, searchParams]);

  return null;
}
