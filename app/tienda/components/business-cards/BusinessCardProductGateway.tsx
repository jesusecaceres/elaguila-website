import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { businessCardConfigurePath, businessCardLeoPath, businessCardUploadPath, withLang } from "../../utils/tiendaRouting";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";
import { LeoBrandMark } from "./LeoBrandMark";

export function BusinessCardProductGateway(props: { lang: Lang; productSlug: string }) {
  const { lang, productSlug } = props;

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.72)] max-w-3xl">
        {bcpPick(businessCardProductCopy.standardIntro, lang)}
      </p>

      {/* Flagship: LEO — full-width on mobile, horizontal on md+ */}
      <section
        className="relative overflow-hidden rounded-3xl border border-[rgba(201,168,74,0.5)] bg-[linear-gradient(135deg,rgba(201,168,74,0.16)_0%,rgba(10,10,12,0.92)_45%,rgba(18,18,22,0.98)_100%)] p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        aria-labelledby="bc-gateway-leo-heading"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgba(201,168,74,0.08)] blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <div className="flex shrink-0 justify-center md:justify-start">
            <div className="rounded-2xl border border-[rgba(201,168,74,0.25)] bg-[rgba(0,0,0,0.25)] px-6 py-5">
              <LeoBrandMark width={168} className="mx-auto max-w-[min(100%,180px)]" />
            </div>
          </div>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <span className="inline-flex rounded-full bg-[color:var(--lx-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-text)]">
              {bcpPick(businessCardProductCopy.pathLeoBadge, lang)}
            </span>
            <h2 id="bc-gateway-leo-heading" className="mt-4 text-xl font-semibold tracking-tight text-[rgba(255,247,226,0.98)] sm:text-2xl">
              {bcpPick(businessCardProductCopy.pathLeoTitle, lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.74)] sm:text-[15px]">
              {bcpPick(businessCardProductCopy.pathLeoBody, lang)}
            </p>
            <Link
              href={withLang(businessCardLeoPath(productSlug), lang)}
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_14px_40px_rgba(201,168,74,0.3)] transition hover:brightness-95 sm:w-auto"
            >
              {bcpPick(businessCardProductCopy.pathLeoCta, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Secondary paths: manual template, production upload, advanced builder */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <div className="flex min-h-[260px] flex-col rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] p-6">
          <span className="inline-flex self-start rounded-full border border-[rgba(255,255,255,0.22)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgba(255,247,226,0.78)]">
            {bcpPick(businessCardProductCopy.pathTemplateBadge, lang)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.96)]">
            {bcpPick(businessCardProductCopy.pathTemplateTitle, lang)}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.66)]">
            {bcpPick(businessCardProductCopy.pathTemplateBody, lang)}
          </p>
          <Link
            href={withLang(businessCardConfigurePath(productSlug, { entry: "template" }), lang)}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(255,247,226,0.95)] transition hover:bg-[rgba(201,168,74,0.18)]"
          >
            {bcpPick(businessCardProductCopy.pathTemplateCta, lang)}
          </Link>
        </div>
        <div className="flex min-h-[260px] flex-col rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] p-6 ring-1 ring-inset ring-[rgba(255,252,247,0.06)]">
          <span className="inline-flex self-start rounded-full bg-[rgba(255,252,247,0.12)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgba(255,247,226,0.85)]">
            {bcpPick(businessCardProductCopy.pathUploadBadge, lang)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.96)]">
            {bcpPick(businessCardProductCopy.pathUploadTitle, lang)}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.66)]">
            {bcpPick(businessCardProductCopy.pathUploadBody, lang)}
          </p>
          <Link
            href={withLang(businessCardUploadPath(productSlug), lang)}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(255,252,247,0.35)] bg-[rgba(255,252,247,0.94)] px-5 py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_12px_34px_rgba(201,168,74,0.15)] transition hover:brightness-95"
          >
            {bcpPick(businessCardProductCopy.pathUploadCta, lang)}
          </Link>
        </div>
        <div className="flex min-h-[260px] flex-col rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] p-6">
          <span className="inline-flex self-start rounded-full border border-[rgba(201,168,74,0.35)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.9)]">
            {bcpPick(businessCardProductCopy.pathCustomBadge, lang)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.96)]">
            {bcpPick(businessCardProductCopy.pathCustomTitle, lang)}
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.66)]">
            {bcpPick(businessCardProductCopy.pathCustomBody, lang)}
          </p>
          <Link
            href={withLang(businessCardConfigurePath(productSlug, { entry: "custom" }), lang)}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(201,168,74,0.42)] bg-transparent px-5 py-3 text-sm font-semibold text-[rgba(255,247,226,0.92)] transition hover:bg-[rgba(201,168,74,0.1)]"
          >
            {bcpPick(businessCardProductCopy.pathCustomCta, lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
