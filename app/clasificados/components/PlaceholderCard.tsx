"use client";

import { useSearchParams } from "next/navigation";

export default function PlaceholderCard() {
  const params = useSearchParams();

  // Next.js types may allow `params` to be null during build-time type checking.
  const lang = params?.get("lang") === "en" ? "en" : "es";

  const label = lang === "en" ? "Advertise Here" : "Anúnciate Aquí";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-gray-100">{label}</div>
      <div className="mt-2 h-24 rounded-xl border border-white/10 bg-black/20" />
      <div className="mt-2 text-xs text-gray-400">
        {lang === "en"
          ? "Reserved space for featured placements."
          : "Espacio reservado para destacados."}
      </div>
    </div>
  );
}
