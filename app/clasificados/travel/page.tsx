"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

export default function TravelCategoryPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const lang = (sp?.get("lang") === "en" ? "en" : "es") as Lang;

  const targetHref = useMemo(() => {
    const next = new URLSearchParams();

    // Preserve existing params (future-proof: location, radius, search, etc.)
    if (sp) {
      sp.forEach((value, key) => {
        if (typeof value === "string" && value.length > 0) next.set(key, value);
      });
    }

    next.set("lang", lang);
    next.set("cat", "travel");

    return `/clasificados/lista?${next.toString()}`;
  }, [lang, sp]);

  useEffect(() => {
    router.replace(targetHref);
  }, [router, targetHref]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-20 pb-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src={newLogo}
              alt="LEONIX"
              width={92}
              height={92}
              className="h-20 w-20 sm:h-24 sm:w-24"
              priority
            />
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#d4af37]">
              {lang === "en" ? "Travel" : "Viajes"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/80">
              {lang === "en" ? "Redirecting to listings…" : "Redirigiendo a los anuncios…"}
            </p>

            <a
              href={targetHref}
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {lang === "en" ? "Open Travel listings" : "Ver anuncios de Viajes"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
