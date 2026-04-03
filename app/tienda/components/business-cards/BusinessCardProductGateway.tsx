import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { businessCardGatewayVisuals } from "../../data/tiendaVisualAssets";
import {
  businessCardConfigurePath,
  businessCardLeoPath,
  businessCardUploadPath,
  tiendaPublicContactPath,
  withLang,
} from "../../utils/tiendaRouting";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";
import { LeoBrandMark } from "./LeoBrandMark";
import { TiendaRemoteFillImage } from "../TiendaRemoteFillImage";

function GatewayImageStrip(props: {
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  imageClassName?: string;
}) {
  const { primarySrc, fallbackSrc, alt, imageClassName } = props;
  return (
    <div className="relative h-[140px] w-full overflow-hidden border-b border-[rgba(255,255,255,0.08)] sm:h-[160px]">
      <TiendaRemoteFillImage
        primarySrc={primarySrc}
        fallbackSrc={fallbackSrc}
        alt={alt}
        className={imageClassName ?? "object-cover object-center"}
        sizes="(max-width: 768px) 100vw, 400px"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070708]/90 via-[#070708]/25 to-transparent" />
    </div>
  );
}

export function BusinessCardProductGateway(props: { lang: Lang; productSlug: string }) {
  const { lang, productSlug } = props;
  const v = businessCardGatewayVisuals;

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.72)] max-w-3xl">
        {bcpPick(businessCardProductCopy.standardIntro, lang)}
      </p>

      {/* 1) LEO */}
      <section
        className="relative overflow-hidden rounded-3xl border border-[rgba(201,168,74,0.5)] bg-[linear-gradient(135deg,rgba(201,168,74,0.14)_0%,rgba(10,10,12,0.94)_42%,rgba(18,18,22,0.98)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        aria-labelledby="bc-gateway-leo-heading"
      >
        <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative min-h-[180px] border-b border-[rgba(255,255,255,0.08)] md:border-b-0 md:border-r">
            <TiendaRemoteFillImage
              primarySrc={v.leo.primary}
              fallbackSrc={v.leo.fallback}
              alt={lang === "en" ? "Stack of premium business cards" : "Montón de tarjetas de presentación"}
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 45vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070708]/85 via-[#070708]/20 to-transparent md:bg-gradient-to-l md:from-transparent md:via-[#070708]/15 md:to-[#070708]/88" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-4 flex justify-center md:justify-start">
              <div className="rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[rgba(0,0,0,0.2)] px-5 py-4">
                <LeoBrandMark width={120} className="mx-auto max-w-[min(100%,140px)]" />
              </div>
            </div>
            <span className="inline-flex self-center rounded-full bg-[color:var(--lx-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-text)] md:self-start">
              {bcpPick(businessCardProductCopy.pathLeoBadge, lang)}
            </span>
            <h2 id="bc-gateway-leo-heading" className="mt-4 text-center text-xl font-semibold tracking-tight text-[rgba(255,247,226,0.98)] sm:text-2xl md:text-left">
              {bcpPick(businessCardProductCopy.pathLeoTitle, lang)}
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-[rgba(255,255,255,0.74)] sm:text-[15px] md:text-left">
              {bcpPick(businessCardProductCopy.pathLeoBody, lang)}
            </p>
            <Link
              href={withLang(businessCardLeoPath(productSlug), lang)}
              className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_14px_40px_rgba(201,168,74,0.3)] transition hover:brightness-95 md:w-auto md:self-start"
            >
              {bcpPick(businessCardProductCopy.pathLeoCta, lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* 2) Upload final file · 3) Studio rebuild/edit */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] shadow-[0_18px_50px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-[rgba(255,252,247,0.06)]">
          <GatewayImageStrip
            primarySrc={v.upload.primary}
            fallbackSrc={v.upload.fallback}
            alt={lang === "en" ? "Business cards ready for production" : "Tarjetas listas para producción"}
          />
          <div className="flex flex-1 flex-col p-6">
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
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[rgba(201,168,74,0.06)] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <GatewayImageStrip
            primarySrc={v.studio.primary}
            fallbackSrc={v.studio.fallback}
            alt={lang === "en" ? "Front and back business card mockup" : "Mockup de tarjeta frente y reverso"}
            imageClassName="object-contain object-center bg-[#0b0b0d]"
          />
          <div className="flex flex-1 flex-col p-6">
            <span className="inline-flex self-start rounded-full border border-[rgba(201,168,74,0.45)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
              {bcpPick(businessCardProductCopy.pathRefreshBadge, lang)}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-[rgba(255,247,226,0.96)]">
              {bcpPick(businessCardProductCopy.pathRefreshTitle, lang)}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.66)]">
              {bcpPick(businessCardProductCopy.pathRefreshBody, lang)}
            </p>
            <Link
              href={withLang(businessCardConfigurePath(productSlug, { entry: "refresh" }), lang)}
              className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.14)] px-5 py-3 text-sm font-semibold text-[rgba(255,247,226,0.95)] transition hover:bg-[rgba(201,168,74,0.22)]"
            >
              {bcpPick(businessCardProductCopy.pathRefreshCta, lang)}
            </Link>
          </div>
        </div>
      </div>

      <p className="rounded-2xl border border-[rgba(201,168,74,0.2)] bg-[rgba(0,0,0,0.25)] px-4 py-3 text-xs leading-relaxed text-[rgba(255,255,255,0.55)]">
        {bcpPick(businessCardProductCopy.gatewayPathsFootnote, lang)}{" "}
        <Link href={withLang(tiendaPublicContactPath(), lang)} className="font-medium text-[rgba(201,168,74,0.9)] underline-offset-2 hover:underline">
          {bcpPick(businessCardProductCopy.specialtyContactCta, lang)}
        </Link>
      </p>
    </div>
  );
}
