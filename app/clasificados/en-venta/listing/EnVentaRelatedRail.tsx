"use client";

import Link from "next/link";

type Lang = "es" | "en";

export function EnVentaRelatedRail({ lang, q }: { lang: Lang; q: string }) {
  const qq = q.trim().slice(0, 48);
  if (!qq) return null;
  const href = `/clasificados/lista?cat=en-venta&q=${encodeURIComponent(qq)}&lang=${lang}`;
  return (
    <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
      <h2 className="text-sm font-bold text-[#111111]">{lang === "es" ? "Relacionados" : "Related"}</h2>
      <p className="mt-1 text-sm text-[#111111]/65">
        {lang === "es" ? "Explora más artículos similares en En Venta." : "Browse similar For Sale listings."}
      </p>
      <Link href={href} className="mt-3 inline-flex rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
        {lang === "es" ? "Ver similares" : "See similar"}
      </Link>
    </section>
  );
}
