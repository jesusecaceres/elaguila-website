"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ReglasPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const returnUrl = searchParams?.get("return") || `/clasificados/publicar/en-venta?lang=${lang}`;

  const t =
    lang === "es"
      ? {
          title: "Reglas de Leonix (marketplace)",
          intro:
            "Al publicar en LEONIX Clasificados aceptas estas reglas. Leonix debe seguir siendo confiable, claro y apto para toda la familia.",
          rules: [
            "Anuncios reales: describe lo que realmente vendes o ofreces. No anuncios falsos ni engañosos.",
            "Si dice gratis, debe ser gratis de verdad. Sin precios engañosos ni cargos ocultos.",
            "Sin contenido sexual explícito ni productos para adultos; Leonix es un marketplace familiar.",
            "No spam, duplicados abusivos ni estafas. Respeta la ley y a la comunidad.",
            "Sin contenido ilegal, odioso ni que ponga en riesgo a menores. Mantén Leonix seguro y respetuoso.",
          ],
          back: "Volver",
        }
      : {
          title: "Leonix marketplace rules",
          intro:
            "By posting on LEONIX Classifieds you agree to these rules. Leonix must stay trustworthy, clear, and family-appropriate.",
          rules: [
            "Real listings: describe what you actually sell or offer. No fake or misleading ads.",
            "If it says free, it must really be free—no deceptive pricing or hidden fees.",
            "No explicit sexual content or adult products; Leonix is a family-friendly marketplace.",
            "No spam, abusive duplicates, or scams. Follow the law and respect others.",
            "No illegal or hateful content, and nothing that endangers minors. Keep Leonix safe and respectful.",
          ],
          back: "Back",
        };

  const safeReturn = returnUrl.startsWith("/") ? returnUrl : `/clasificados/publicar/en-venta?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="text-2xl font-bold text-[#111111]">{t.title}</h1>
        <p className="mt-3 text-[#111111]/80">{t.intro}</p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#111111]/90">
          {t.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <Link
          href={safeReturn}
          className="mt-6 inline-block rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8]"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
