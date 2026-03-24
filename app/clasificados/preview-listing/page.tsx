"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPreviewDraft } from "@/app/clasificados/lib/previewListingDraft";
import PreviewListingNonBrPage from "./PreviewListingNonBrPage";

/**
 * Legacy shared preview hub: BR drafts redirect to branch-owned preview (non-BR keeps generic UI below).
 */
export default function PreviewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [legacy, setLegacy] = useState(false);

  useEffect(() => {
    const d = getPreviewDraft();
    const qs = searchParams?.toString() ?? "";
    const suff = qs ? `?${qs}` : "";
    if (d?.category === "bienes-raices") {
      const lane = d.branch === "privado" ? "privado" : "negocio";
      router.replace(`/clasificados/bienes-raices/${lane}/preview${suff}`);
      return;
    }
    setLegacy(true);
  }, [router, searchParams]);

  if (!legacy) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] text-[#111111]">
        <div className="pt-28 text-center text-sm text-[#111111]/70">
          {(searchParams?.get("lang") || "es") === "en" ? "Loading…" : "Cargando…"}
        </div>
      </main>
    );
  }

  return <PreviewListingNonBrPage />;
}
