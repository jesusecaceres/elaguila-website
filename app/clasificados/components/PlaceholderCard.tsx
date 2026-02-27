"use client";

import { useSearchParams } from "next/navigation";

export default function PlaceholderCard() {
  const params = useSearchParams();

  // Next.js types may allow `params` to be null during build-time type checking.
  const lang = params?.get("lang") === "en" ? "en" : "es";

  const label = lang === "en" ? "Advertise Here" : "Anúnciate Aquí";

  return (
    <div className="rounded-2xl border border-yellow-500/45 bg-white/8 p-5">
      <div className="text-sm font-semibold text-gray-100">{label}</div>
      <div className="mt-2 h-24 rounded-xl border border-yellow-600/10 bg-white/6" />
      <div className="mt-2 text-xs text-gray-400">
        {lang === "en"
          ? "Reserved space for featured placements — real listings appear here as soon as they’re posted."
          : "Espacio reservado para destacados — los anuncios reales aparecen aquí en cuanto se publiquen."}
      </div>
    </div>
  );
}
