"use client";

import {useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Lang = "es" | "en";

function ClasificadosLoginRedirectContent() {
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
    return searchParams?.get("redirect") || `/dashboard/perfil?require=post&lang=${lang}`;
  }, [searchParams]);

  useEffect(() => {
    const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
    const params = new URLSearchParams();
    params.set("mode", "post");
    params.set("lang", lang);
    params.set("redirect", redirectTo);
    window.location.href = `/login?${params.toString()}`;
  }, [redirectTo, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white/60 text-sm">
      Redirecting…
    </div>
  );
}

export default function ClasificadosLoginRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <ClasificadosLoginRedirectContent />
    </Suspense>
  );
}
