"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryCompactHero } from "@/app/(site)/clasificados/components/categoryStandard/CategoryCompactHero";
import { CategoryStandardCtaRow } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardCtaRow";
import { CategoryStandardLandingPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPageShell";
import {
  categoryStandardDescription,
  categoryStandardTitle,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import type { IglesiasPageCopy } from "@/app/lib/siteSectionContent/iglesiasPageMerge";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";

type Lang = "es" | "en";

const IGLESIAS_UI = {
  es: {
    eyebrow: "FE Y COMUNIDAD · LEONIX",
    publish: "Publicar iglesia",
    browse: "Ver iglesias",
    searchPending: "La búsqueda por iglesia o ciudad estará disponible cuando abramos el directorio.",
  },
  en: {
    eyebrow: "FAITH & COMMUNITY · LEONIX",
    publish: "Post church",
    browse: "View churches",
    searchPending: "Search by church or city will be available when the directory opens.",
  },
} as const;

export function IglesiasPageClient({ shell }: { shell: IglesiasPageCopy }) {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const t = shell[lang];
  const ui = IGLESIAS_UI[lang];
  const contactHref = `${LEONIX_GLOBAL_CONTACT_PATH}?lang=${lang}`;
  const clasificadosHref = `/clasificados?lang=${lang}`;

  return (
    <CategoryStandardLandingPageShell>
      <div className="space-y-5 py-6 sm:space-y-6 sm:py-8">
        <CategoryCompactHero
          category="iglesias"
          lang={lang}
          eyebrow={ui.eyebrow}
          title={categoryStandardTitle("iglesias", lang)}
          description={categoryStandardDescription("iglesias", lang)}
        >
          <p className="rounded-lg border border-[#D6C7AD]/70 bg-[#FAF6EE] px-3 py-2.5 text-xs leading-relaxed text-[#5C5346]">
            {t.note}
          </p>
          <p className="text-xs leading-relaxed text-[#5C5346]/90">{ui.searchPending}</p>
          <div className="mt-2">
            <CategoryStandardCtaRow
              lang={lang}
              publishHref={contactHref}
              browseHref={clasificadosHref}
              publishLabel={ui.publish}
              browseLabel={ui.browse}
            />
          </div>
        </CategoryCompactHero>

        <p className="text-center text-sm text-[#5C5346]">
          <Link
            href={clasificadosHref}
            className="font-medium text-[#556B3E] underline-offset-2 hover:text-[#7A1E2C]"
          >
            {t.backCta}
          </Link>
        </p>
      </div>
    </CategoryStandardLandingPageShell>
  );
}
