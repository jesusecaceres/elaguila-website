import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { businessCardConfigurePath, businessCardUploadPath, withLang } from "../../utils/tiendaRouting";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";

export function BusinessCardProductGateway(props: { lang: Lang; productSlug: string }) {
  const { lang, productSlug } = props;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.72)] max-w-3xl">
        {bcpPick(businessCardProductCopy.standardIntro, lang)}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="relative rounded-2xl border border-[rgba(201,168,74,0.45)] bg-[linear-gradient(165deg,rgba(201,168,74,0.14),rgba(255,255,255,0.04))] p-6 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <span className="inline-flex self-start rounded-full bg-[color:var(--lx-gold)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]">
            {bcpPick(businessCardProductCopy.pathTemplateBadge, lang)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.98)]">
            {bcpPick(businessCardProductCopy.pathTemplateTitle, lang)}
          </h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)] flex-1 leading-relaxed">
            {bcpPick(businessCardProductCopy.pathTemplateBody, lang)}
          </p>
          <Link
            href={withLang(businessCardConfigurePath(productSlug, { entry: "template" }), lang)}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.28)]"
          >
            {bcpPick(businessCardProductCopy.pathTemplateCta, lang)}
          </Link>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] p-6 flex flex-col">
          <h2 className="text-base font-semibold text-[rgba(255,247,226,0.95)]">
            {bcpPick(businessCardProductCopy.pathUploadTitle, lang)}
          </h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.68)] flex-1 leading-relaxed">
            {bcpPick(businessCardProductCopy.pathUploadBody, lang)}
          </p>
          <Link
            href={withLang(businessCardUploadPath(productSlug), lang)}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-[rgba(255,252,247,0.35)] bg-[rgba(255,252,247,0.94)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.15)]"
          >
            {bcpPick(businessCardProductCopy.pathUploadCta, lang)}
          </Link>
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] p-6 flex flex-col">
          <h2 className="text-base font-semibold text-[rgba(255,247,226,0.95)]">
            {bcpPick(businessCardProductCopy.pathCustomTitle, lang)}
          </h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.68)] flex-1 leading-relaxed">
            {bcpPick(businessCardProductCopy.pathCustomBody, lang)}
          </p>
          <Link
            href={withLang(businessCardConfigurePath(productSlug, { entry: "custom" }), lang)}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-[rgba(201,168,74,0.4)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[rgba(255,247,226,0.92)] hover:bg-[rgba(201,168,74,0.12)] transition"
          >
            {bcpPick(businessCardProductCopy.pathCustomCta, lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
