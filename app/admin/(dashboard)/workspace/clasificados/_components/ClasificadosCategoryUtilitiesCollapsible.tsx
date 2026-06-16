"use client";

import Link from "next/link";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

export function ClasificadosCategoryUtilitiesCollapsible({ lang }: { lang: AdminLang }) {
  const m = adminMessages(lang);

  return (
    <section className={`${adminCardBase} mb-6 overflow-hidden p-0`} data-testid="clasificados-category-utilities">
      <details>
        <summary className="cursor-pointer list-none px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <h2 className="text-sm font-bold text-[#1E1810]">Utilities &amp; reference</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Featured on /home, real estate branch notes, and cross-category helpers.</p>
        </summary>
        <div className="space-y-4 border-t border-[#E8DFD0]/70 px-4 py-4 text-xs text-[#5C5346]">
          <div className={`${adminCardBase} space-y-2 p-4`} data-testid="clasificados-home-content-utility">
            <p>
              <strong className="text-[#1E1810]">{m("clasificados.homeChipsTitle")}</strong> {m("clasificados.homeChipsBody")}
            </p>
            <Link href="/admin/workspace/home/content" className={`${adminCtaChipSecondary} inline-flex text-xs`}>
              {m("clasificados.homeContentCta")}
            </Link>
          </div>
          <div className={`${adminCardBase} p-4`}>
            <strong className="text-[#1E1810]">{m("clasificados.brHintTitle")}</strong> {m("clasificados.brHintBody")}{" "}
            <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/bienes-raices/preview/*</code>,{" "}
            <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/rentas/preview/*</code>.
          </div>
        </div>
      </details>
    </section>
  );
}
