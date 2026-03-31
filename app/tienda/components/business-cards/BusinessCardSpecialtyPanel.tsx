import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { withLang } from "../../utils/tiendaRouting";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";

export function BusinessCardSpecialtyPanel(props: { lang: Lang }) {
  const { lang } = props;
  return (
    <section className="rounded-3xl border border-[rgba(201,168,74,0.22)] bg-[linear-gradient(180deg,rgba(35,35,38,0.96),rgba(12,12,14,0.98))] p-6 sm:p-8 shadow-[0_22px_70px_rgba(0,0,0,0.4)]">
      <h2 className="text-lg font-semibold tracking-tight text-[rgba(255,247,226,0.95)]">
        {bcpPick(businessCardProductCopy.specialtyTitle, lang)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.72)] max-w-2xl">
        {bcpPick(businessCardProductCopy.specialtyBody, lang)}
      </p>
      <p className="mt-3 text-sm text-[rgba(201,168,74,0.85)] max-w-2xl">
        {bcpPick(businessCardProductCopy.specialtyExamples, lang)}
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <Link
          href={withLang("/contacto", lang)}
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
        >
          {bcpPick(businessCardProductCopy.specialtyContactCta, lang)}
        </Link>
        <span className="text-xs text-[rgba(255,255,255,0.58)] max-w-md">
          {bcpPick(businessCardProductCopy.specialtyOfficeHint, lang)}
        </span>
      </div>
    </section>
  );
}
