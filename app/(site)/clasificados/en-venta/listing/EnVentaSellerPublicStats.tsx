"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

type Lang = "es" | "en";

/**
 * Honest public trust cue: count of this seller’s active En Venta rows (same table buyers browse).
 * If RLS blocks the count for anonymous viewers, the band stays hidden — no fake numbers.
 */
export function EnVentaSellerPublicStats({ ownerId, lang }: { ownerId: string | null | undefined; lang: Lang }) {
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    const id = (ownerId ?? "").trim();
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { count, error } = await sb
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", id)
          .eq("category", "en-venta")
          .eq("status", "active");
        if (cancelled || error || typeof count !== "number") return;
        setActiveCount(count);
      } catch {
        /* RLS or network — omit cue */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  if (activeCount == null || activeCount < 1) return null;

  const line =
    lang === "es"
      ? `Este vendedor tiene ${activeCount} anuncio(s) activo(s) en En Venta en Leonix (contador público).`
      : `This seller has ${activeCount} active For Sale listing(s) on Leonix (public count).`;

  return (
    <p className="mt-2 rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-[#111111]/70">
      {line}
    </p>
  );
}
