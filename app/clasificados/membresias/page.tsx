"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Membresías",
    line1: "Te estamos llevando a tu cuenta.",
    line2: "Si no te redirige automáticamente, usa el botón:",
    button: "Ir a Cuenta",
  },
  en: {
    title: "Memberships",
    line1: "Taking you to your account.",
    line2: "If you are not redirected automatically, use the button:",
    button: "Go to Account",
  },
} as const;

export default function RedirectToCuenta() {
  const sp = useSearchParams();
  const router = useRouter();

  const lang: Lang = useMemo(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);

  const href = useMemo(() => {
    const base = "/clasificados/cuenta";
    const hasQuery = base.includes("?");
    const next = `${base}${hasQuery ? "&" : "?"}lang=${lang}`;
    return next;
  }, [lang]);

  useEffect(() => {
    router.replace(href);
  }, [router, href]);

  const c = COPY[lang];

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-3">{c.title}</h1>
        <p className="text-white/80 mb-2">{c.line1}</p>
        <p className="text-white/60 mb-6">{c.line2}</p>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-[#D4AF37] text-black font-semibold hover:opacity-90"
        >
          {c.button}
        </Link>
      </div>
    </main>
  );
}
