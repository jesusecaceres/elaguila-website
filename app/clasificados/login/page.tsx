"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

type Lang = "es" | "en";

export default function ClasificadosLoginRedirect() {
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
    return searchParams?.get("redirect") || `/clasificados/publicar?lang=${lang}`;
  }, [searchParams]);

  useEffect(() => {
    const next = `/login?redirect=${encodeURIComponent(redirectTo)}`;
    window.location.href = next;
  }, [redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p>Redirigiendo al inicio de sesión…</p>
    </div>
  );
}
