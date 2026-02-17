"use client";

import { useSearchParams } from "next/navigation";

export default function PlaceholderCard() {
  const params = useSearchParams();

  // Next.js types may allow `params` to be null during build-time type checking.
  const lang = params?.get("lang") === "en" ? "en" : "es";

  const label = lang === "en" ? "Advertise Here" : "Anúnciate Aquí";

  return (
    <div className="rounded-2xl border border-yellow-600/20 bg-black/30 p-5">
      <div className="text-sm text-gray-300">{label}</div>
      <div className="mt-2 h-24 rounded-xl border border-yellow-600/10 bg-black/30" />
    </div>
  );
}
