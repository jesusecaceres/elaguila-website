"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { categoryConfig, type CategoryKey } from "../config/categoryConfig";

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}

/**
 * Lightweight auth gate for /clasificados/publicar.
 * Every category must use its own route: /publicar/en-venta, /publicar/bienes-raices, /publicar/rentas, etc.
 * Root /publicar (no slug): redirect to category from ?cat= or default en-venta. Logged-out users go to login with that category-specific redirect.
 */
export default function PublicarRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams?.get("lang") ?? "es";
    const catParam = searchParams?.get("cat") ?? "";
    const slug = normalizeCategory(catParam) || "bienes-raices";
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (!p.has("lang")) p.set("lang", lang);
    p.delete("cat");
    const qs = p.toString();
    const queryString = qs ? `?${qs}` : `?lang=${lang}`;
    const publicarUrl = `/clasificados/publicar/${slug}${queryString}`;
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
