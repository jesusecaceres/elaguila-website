"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getLeonixMarketplaceRulesCopy } from "@/app/clasificados/en-venta/shared/lib/leonixMarketplaceRulesCopy";

export default function ReglasPage() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const returnUrl = searchParams?.get("return") || `/clasificados/publicar/en-venta?lang=${lang}`;

  const t = getLeonixMarketplaceRulesCopy(lang);
  const back = lang === "es" ? "Volver" : "Back";

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
          {back}
        </Link>
      </div>
    </main>
  );
}
