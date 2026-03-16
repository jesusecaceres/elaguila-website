"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Pure redirect for /clasificados/publicar.
 * No auth check here — the category route [category]/page.tsx is the single session gate.
 * Immediately redirect to the publish flow with lang preserved.
 */
export default function PublicarRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams?.get("lang") ?? "es";
    const qs = searchParams?.toString() ?? "";
    const queryString = qs ? `?${qs}` : `?lang=${lang}`;
    router.replace(`/clasificados/publicar/en-venta${queryString}`);
  }, [router, searchParams]);

  return null;
}
