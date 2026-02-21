"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = useMemo<Lang>(() => {
    const v = sp?.get("lang");
    return v === "en" ? "en" : "es";
  }, [sp]);

  useEffect(() => {
    const params = new URLSearchParams(sp?.toString() ?? "");

    // Force category to unified engine (canonical results)
    params.set("cat", "autos");
    // Backward-compatible: also set "category" if something else still reads it
    params.set("category", "autos");

    router.replace("/clasificados/lista?" + params.toString());
  }, [router, sp]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-lg font-semibold text-yellow-300">
          {lang === "es" ? "Cargando…" : "Loading…"}
        </div>
        <div className="mt-2 text-sm text-gray-300">
          {lang === "es"
            ? "Redirigiendo a resultados…"
            : "Redirecting to results…"}
        </div>
      </div>
    </div>
  );
}
