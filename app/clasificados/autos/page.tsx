"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    // Force category to unified engine
    params.set("category", "autos");
    router.replace(`/clasificados/lista?${params.toString()}`);
  }, [router, sp]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-lg font-semibold text-yellow-300">Cargando…</div>
        <div className="mt-2 text-sm text-gray-300">
          Redirecting to results…
        </div>
      </div>
    </div>
  );
}
