"use client";

import type { ReactNode } from "react";
import { FiCopy, FiExternalLink } from "react-icons/fi";
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiSnapchat,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import {
  buildContactModel,
  buildMainAgentBusinessHub,
  buildSecondAgentSocialHrefs,
  effectiveAgente2TelefonoPersonal,
  effectiveAgenteTelefonoOficina,
  effectiveAgenteTelefonoPersonal,
  formatPreviewPhoneDisplay,
  hasBrandBlockVisible,
  hasSecondAgentRailContent,
  hrefFromUserInput,
  trim,
  type AgenteResPreviewLocale,
} from "../lib/agenteResidencialPreviewFormat";
import { digitsOnly } from "../application/utils/phoneMask";
import {
  trackBrEmailClickGlobal,
  trackBrGoogleBusinessClickGlobal,
  trackBrGoogleReviewsClickGlobal,
  trackBrMlsClickGlobal,
  trackBrPhoneClickGlobal,
  trackBrRequestInfoClickGlobal,
  trackBrScheduleVisitClickGlobal,
  trackBrTourVideoClickGlobal,
  trackBrBrochureClickGlobal,
  trackBrWebsiteClickGlobal,
  trackBrWhatsAppClickGlobal,
  trackBrYelpClickGlobal,
  type BrGlobalAnalyticsContext,
} from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";
import { dispatchConnectionHubCta } from "@/app/lib/analytics/client/connectionHubCtaDispatch";
import { SharedConnectionHubReviewButton } from "@/app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton";

/** Package D Build D2, Gate 6A — real listing identity for the live published detail render only.
 * Reuses the existing canonical `brGlobalAnalytics.ts` module; this component fires no analytics of
 * its own vocabulary. Undefined/null on the pre-publish owner preview, where clicks must not track. */
export type BrAgenteResContactSidebarAnalyticsContext = BrGlobalAnalyticsContext;

const BORDER = "rgba(44, 36, 22, 0.1)";
const CREAM = "#FDFBF7";
const CHARCOAL = "#2C2416";
const MUTED = "#5C5346";
const MUTED_LIGHT = "#7a7165";
const BRONZE = "#B8954A";
const BURGUNDY = "#6E2B2B";

function CardShell({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className="mb-3 rounded-xl border px-3 py-3 sm:px-3.5 sm:py-3.5"
      style={{
        borderColor: emphasis ? "rgba(201, 180, 106, 0.55)" : "rgba(201, 180, 106, 0.38)",
        background: emphasis
          ? "linear-gradient(180deg, rgba(255,252,247,0.99) 0%, rgba(255,246,231,0.92) 100%)"
          : "linear-gradient(180deg, rgba(253,251,247,0.98) 0%, rgba(249,246,241,0.9) 100%)",
        boxShadow: emphasis ? "0 2px 16px rgba(44,36,22,0.07)" : "0 1px 10px rgba(44,36,22,0.04)",
      }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: BRONZE }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function SocialCircle({
  href,
  label,
  children,
  color,
  onClick,
}: {
  href: string;
  label: string;
  children: ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 transition hover:bg-white sm:h-8 sm:w-8"
      style={{ borderColor: BORDER, color: color ?? CHARCOAL }}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

function ReviewCard({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border bg-white/80 px-3 py-2.5 text-[12px] font-semibold transition hover:bg-white"
      style={{ borderColor: "rgba(201, 180, 106, 0.45)", color: CHARCOAL }}
      onClick={onClick}
    >
      <span>{label}</span>
      <FiExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

type PreviewUi = {
  sitioWeb: string;
  area: string;
  idiomas: string;
  fotoAgente: string;
  telPersonal: string;
  telOficina: string;
  licenciaAgente: string;
  licenciaMarca: string;
  llamar: string;
  whatsapp: string;
  solicitarInfo: string;
  programarVisita: string;
  verSitioWeb: string;
  verListado: string;
  verMls: string;
  verTour: string;
  verFolleto: string;
  googleReviews: string;
  yelpReviews: string;
  googleBusiness: string;
  businessHubReviews: string;
  officeBrokerLabel: string;
  mainAgentLabel: string;
  secondAgentLabel: string;
  quickActionsLabel: string;
};

function openInNewTabAnchorProps() {
  return { target: "_blank" as const, rel: "noopener noreferrer" };
}

function EmailRow({
  email,
  copyLabel,
  onEmailClick,
}: {
  email: string;
  copyLabel: string;
  onEmailClick?: () => void;
}) {
  const trimmed = email.trim();
  if (!trimmed) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <a
        href={`mailto:${trimmed}`}
        className="truncate text-[12px] font-semibold"
        style={{ color: BRONZE }}
        onClick={onEmailClick}
      >
        {trimmed}
      </a>
      <button
        type="button"
        aria-label={copyLabel}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition hover:bg-white"
        style={{ borderColor: BORDER, color: MUTED }}
        onClick={() => {
          void navigator.clipboard?.writeText(trimmed).catch(() => {});
        }}
      >
        <FiCopy className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function BrAgenteResContactSidebar({
  data,
  locale: _locale,
  p,
  analyticsContext,
}: {
  data: AgenteIndividualResidencialFormState;
  locale: AgenteResPreviewLocale;
  p: PreviewUi;
  analyticsContext?: BrAgenteResContactSidebarAnalyticsContext | null;
}) {
  const cr = buildContactModel(data);
  const track = (fn: (ctx: BrGlobalAnalyticsContext) => void) => {
    if (analyticsContext) fn(analyticsContext);
  };
  // Item 20 (Final Completion) — Global Business Hub OS adoption doc classifies BR Negocio as
  // "B — surgical shared-primitive adoption": the review-link BUTTON visuals swap to the shared
  // Level-A component (behavior-equivalent to Servicios' own swap), analytics stay on the
  // existing brGlobalAnalytics dispatch this sidebar already uses.
  const openReview = (url: string, fn: (ctx: BrGlobalAnalyticsContext) => void) => {
    track(fn);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  // Package D Build D3, Gate 2 — social-icon clicks (the one D2-deferred gap on this component)
  // use the shared dispatcher directly; no dedicated brGlobalAnalytics.ts export exists for a
  // generic social-platform click, and the shared contract already covers this exact case.
  const trackSocial = (provider: string) => {
    if (!analyticsContext) return;
    dispatchConnectionHubCta({
      kind: "social",
      provider,
      category: "bienes-raices",
      sourceTable: "listings",
      sourceId: analyticsContext.listingUuid,
      surface: "contact_sidebar",
      leonixAdId: analyticsContext.leonixAdId,
    });
  };
  const locale = _locale;
  const hub = buildMainAgentBusinessHub(data, locale);
  const showBrand = hasBrandBlockVisible(data);
  const showSecondAgentRail = hasSecondAgentRailContent(data);
  const agente2Social = buildSecondAgentSocialHrefs(data);

  const brandLicenseLine = showBrand && trim(data.marcaLicencia) ? `${p.licenciaMarca} ${trim(data.marcaLicencia)}` : "";
  const resolvedBrandSite = showBrand ? hrefFromUserInput(data.marcaSitioWeb) : null;
  const agentLicenseLine = trim(data.agenteLicencia) ? `${p.licenciaAgente} ${trim(data.agenteLicencia)}` : "";
  const agente2LicenseLine = trim(data.agente2Licencia) ? `${p.licenciaAgente} ${trim(data.agente2Licencia)}` : "";

  const agentePersonalRaw = effectiveAgenteTelefonoPersonal(data);
  const agenteOfficeRaw = effectiveAgenteTelefonoOficina(data);
  const agentePersonalOk = digitsOnly(agentePersonalRaw).length >= 10;
  const agenteOfficeOk = digitsOnly(agenteOfficeRaw).length >= 10;
  const agenteCardSiteHref = hub.websiteHref;

  const agente2PersonalRaw = effectiveAgente2TelefonoPersonal(data);
  const agente2OfficeRaw = trim(data.agente2TelefonoOficina);
  const agente2PersonalOk = digitsOnly(agente2PersonalRaw).length >= 10;
  const agente2OfficeOk = digitsOnly(agente2OfficeRaw).length >= 10;

  const hasQuickActions = Boolean(
    cr.showLlamar ||
      cr.showWhatsapp ||
      cr.showSolicitarInformacion ||
      cr.showProgramarVisita ||
      cr.showVerSitioWeb ||
      cr.showVerListado ||
      cr.showVerMls ||
      cr.showVerTour ||
      cr.showVerFolleto,
  );

  return (
    <>
      {showBrand ? (
        <CardShell label={p.officeBrokerLabel}>
          {trim(data.marcaLogoDataUrl) ? (
            <div className="mx-auto mb-2 flex h-[4rem] w-full max-w-[180px] items-center justify-center">
              <img src={trim(data.marcaLogoDataUrl)} alt="" className="max-h-full max-w-full object-contain" />
            </div>
          ) : null}
          {trim(data.marcaNombre) ? (
            <p className="text-center text-[13px] font-bold leading-snug" style={{ color: MUTED }}>
              {trim(data.marcaNombre)}
            </p>
          ) : null}
          {brandLicenseLine ? (
            <p className="mt-1.5 text-center text-[10px] leading-snug" style={{ color: MUTED_LIGHT }}>
              {brandLicenseLine}
            </p>
          ) : null}
          {resolvedBrandSite ? (
            <a
              href={resolvedBrandSite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-1 text-center text-[11px] font-semibold"
              style={{ color: BRONZE }}
            >
              {p.sitioWeb}
              <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
            </a>
          ) : null}
        </CardShell>
      ) : null}

      <CardShell label={p.mainAgentLabel} emphasis>
        <div className="mx-auto w-full max-w-[220px]">
          {trim(data.agenteFotoDataUrl) ? (
            <img
              src={trim(data.agenteFotoDataUrl)}
              alt=""
              className="mx-auto aspect-square w-full max-h-[220px] rounded-lg border object-cover"
              style={{ borderColor: BORDER }}
            />
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center rounded-lg border text-[11px] font-medium"
              style={{ borderColor: BORDER, color: MUTED, background: CREAM }}
            >
              {p.fotoAgente}
            </div>
          )}
        </div>
        {trim(data.agenteNombre) ? (
          <p className="mt-2.5 text-center text-base font-bold leading-tight tracking-tight">{trim(data.agenteNombre)}</p>
        ) : null}
        {trim(data.agenteTitulo) ? (
          <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE }}>
            {trim(data.agenteTitulo)}
          </p>
        ) : null}
        {trim(data.agenteAreaServicio) ? (
          <p className="mt-2 text-center text-[12px]" style={{ color: MUTED }}>
            <span className="font-semibold opacity-85">{p.area}</span> {trim(data.agenteAreaServicio)}
          </p>
        ) : null}
        {trim(data.agenteIdiomas) ? (
          <p className="mt-1 text-center text-[12px]" style={{ color: MUTED }}>
            <span className="font-semibold opacity-85">{p.idiomas}</span> {trim(data.agenteIdiomas)}
          </p>
        ) : null}
        {agentLicenseLine ? (
          <p className="mt-2 text-center text-[10px] leading-snug" style={{ color: MUTED_LIGHT }}>
            {agentLicenseLine}
          </p>
        ) : null}

        {agentePersonalOk || agenteOfficeOk || trim(data.correoPrincipal) || agenteCardSiteHref ? (
          <div className="mt-3 space-y-1.5 rounded-lg border px-2.5 py-2.5 text-center" style={{ borderColor: BORDER, background: "rgba(255,252,247,0.7)" }}>
            {agentePersonalOk ? (
              <p className="text-[12px] font-semibold leading-snug">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telPersonal}</span>
                <a
                  href={`tel:${digitsOnly(agentePersonalRaw)}`}
                  className="text-[#2C2416] underline-offset-2 hover:underline"
                  onClick={() => track(trackBrPhoneClickGlobal)}
                >
                  {formatPreviewPhoneDisplay(agentePersonalRaw)}
                </a>
              </p>
            ) : null}
            {agenteOfficeOk ? (
              <p className="text-[12px] font-semibold leading-snug">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/90">{p.telOficina}</span>
                <a
                  href={`tel:${digitsOnly(agenteOfficeRaw)}`}
                  className="text-[#2C2416] underline-offset-2 hover:underline"
                  onClick={() => track(trackBrPhoneClickGlobal)}
                >
                  {formatPreviewPhoneDisplay(agenteOfficeRaw)}
                </a>
              </p>
            ) : null}
            {trim(data.correoPrincipal) ? (
              <EmailRow
                email={trim(data.correoPrincipal)}
                copyLabel={locale === "en" ? "Copy email" : "Copiar correo"}
                onEmailClick={() => track(trackBrEmailClickGlobal)}
              />
            ) : null}
            {agenteCardSiteHref ? (
              <a
                href={agenteCardSiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold"
                style={{ color: BRONZE }}
                onClick={() => track(trackBrWebsiteClickGlobal)}
              >
                {p.sitioWeb}
                <FiExternalLink className="h-3 w-3 opacity-80" aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}

        {hub.hasSocialIcons || hub.hasBusinessLinks || hub.businessExtraLinks.length ? (
          <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: BORDER }}>
            {hub.hasSocialIcons ? (
              <div className="flex flex-wrap justify-center gap-1.5">
                {hub.socialInstagram ? (
                  <SocialCircle href={hub.socialInstagram} label="Instagram" color="#E4405F" onClick={() => trackSocial("instagram")}>
                    <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialFacebook ? (
                  <SocialCircle href={hub.socialFacebook} label="Facebook" color="#1877F2" onClick={() => trackSocial("facebook")}>
                    <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialYoutube ? (
                  <SocialCircle href={hub.socialYoutube} label="YouTube" color="#FF0000" onClick={() => trackSocial("youtube")}>
                    <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialTiktok ? (
                  <SocialCircle href={hub.socialTiktok} label="TikTok" color="#010101" onClick={() => trackSocial("tiktok")}>
                    <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialLinkedin ? (
                  <SocialCircle href={hub.socialLinkedin} label="LinkedIn" color="#0A66C2" onClick={() => trackSocial("linkedin")}>
                    <SiLinkedin className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialX ? (
                  <SocialCircle href={hub.socialX} label="X" color="#14171A" onClick={() => trackSocial("x")}>
                    <SiX className="h-3 w-3" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialSnapchat ? (
                  <SocialCircle href={hub.socialSnapchat} label="Snapchat" color="#FFFC00" onClick={() => trackSocial("snapchat")}>
                    <SiSnapchat className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
                {hub.socialOtro ? (
                  <SocialCircle href={hub.socialOtro} label="Enlace" onClick={() => trackSocial("other")}>
                    <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </SocialCircle>
                ) : null}
              </div>
            ) : null}
            {hub.googleBusinessUrl ? (
              <SharedConnectionHubReviewButton
                link={{ provider: "google", label: p.googleBusiness, url: hub.googleBusinessUrl }}
                lang={locale}
                onClick={() => openReview(hub.googleBusinessUrl, trackBrGoogleBusinessClickGlobal)}
              />
            ) : null}
            {(hub.googleReviewsUrl || hub.yelpReviewsUrl) && (hub.googleBusinessUrl || hub.hasSocialIcons) ? (
              <p className="pt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE }}>
                {p.businessHubReviews}
              </p>
            ) : null}
            {hub.googleReviewsUrl ? (
              <SharedConnectionHubReviewButton
                link={{ provider: "google", label: p.googleReviews, url: hub.googleReviewsUrl }}
                lang={locale}
                onClick={() => openReview(hub.googleReviewsUrl, trackBrGoogleReviewsClickGlobal)}
              />
            ) : null}
            {hub.yelpReviewsUrl ? (
              <SharedConnectionHubReviewButton
                link={{ provider: "yelp", label: p.yelpReviews, url: hub.yelpReviewsUrl }}
                lang={locale}
                onClick={() => openReview(hub.yelpReviewsUrl, trackBrYelpClickGlobal)}
              />
            ) : null}
            {hub.businessExtraLinks.map((link) => (
              <ReviewCard key={link.href} href={link.href} label={link.label} />
            ))}
          </div>
        ) : null}
      </CardShell>

      {showSecondAgentRail ? (
        <CardShell label={p.secondAgentLabel}>
          {trim(data.agente2FotoDataUrl) ? (
            <div className="mx-auto mt-1 flex max-w-[120px] justify-center">
              <img
                src={trim(data.agente2FotoDataUrl)}
                alt=""
                className="aspect-square w-full max-h-[120px] rounded-md border object-cover"
                style={{ borderColor: BORDER }}
              />
            </div>
          ) : null}
          {trim(data.agente2Nombre) ? (
            <p className="mt-2 text-center text-sm font-bold leading-tight" style={{ color: CHARCOAL }}>
              {trim(data.agente2Nombre)}
            </p>
          ) : null}
          {trim(data.agente2Titulo) ? (
            <p className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: BRONZE }}>
              {trim(data.agente2Titulo)}
            </p>
          ) : null}
          {agente2LicenseLine ? (
            <p className="mt-2 text-center text-[10px] leading-snug" style={{ color: MUTED_LIGHT }}>
              {agente2LicenseLine}
            </p>
          ) : null}
          {agente2PersonalOk || agente2OfficeOk || trim(data.agente2Correo) ? (
            <div className="mt-2 space-y-1 text-center">
              {agente2PersonalOk ? (
                <p className="text-[11px] leading-snug">
                  <span className="font-semibold text-[#5C5346]">{p.telPersonal}:</span>{" "}
                  <a href={`tel:${digitsOnly(agente2PersonalRaw)}`} className="font-semibold text-[#2C2416] underline-offset-2 hover:underline">
                    {formatPreviewPhoneDisplay(agente2PersonalRaw)}
                  </a>
                </p>
              ) : null}
              {agente2OfficeOk ? (
                <p className="text-[11px] leading-snug">
                  <span className="font-semibold text-[#5C5346]">{p.telOficina}:</span>{" "}
                  <a href={`tel:${digitsOnly(agente2OfficeRaw)}`} className="font-semibold text-[#2C2416] underline-offset-2 hover:underline">
                    {formatPreviewPhoneDisplay(agente2OfficeRaw)}
                  </a>
                </p>
              ) : null}
              {trim(data.agente2Correo) ? (
                <EmailRow email={trim(data.agente2Correo)} copyLabel={locale === "en" ? "Copy email" : "Copiar correo"} />
              ) : null}
            </div>
          ) : null}
          {agente2Social.showRow ? (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t pt-3" style={{ borderColor: BORDER }}>
              {agente2Social.socialInstagram ? (
                <SocialCircle href={agente2Social.socialInstagram} label="Instagram" color="#E4405F" onClick={() => trackSocial("instagram")}>
                  <SiInstagram className="h-3.5 w-3.5" aria-hidden />
                </SocialCircle>
              ) : null}
              {agente2Social.socialFacebook ? (
                <SocialCircle href={agente2Social.socialFacebook} label="Facebook" color="#1877F2" onClick={() => trackSocial("facebook")}>
                  <SiFacebook className="h-3.5 w-3.5" aria-hidden />
                </SocialCircle>
              ) : null}
              {agente2Social.socialYoutube ? (
                <SocialCircle href={agente2Social.socialYoutube} label="YouTube" color="#FF0000" onClick={() => trackSocial("youtube")}>
                  <SiYoutube className="h-3.5 w-3.5" aria-hidden />
                </SocialCircle>
              ) : null}
              {agente2Social.socialTiktok ? (
                <SocialCircle href={agente2Social.socialTiktok} label="TikTok" color="#010101" onClick={() => trackSocial("tiktok")}>
                  <SiTiktok className="h-3.5 w-3.5" aria-hidden />
                </SocialCircle>
              ) : null}
              {agente2Social.socialX ? (
                <SocialCircle href={agente2Social.socialX} label="X" color="#14171A" onClick={() => trackSocial("x")}>
                  <SiX className="h-3 w-3" aria-hidden />
                </SocialCircle>
              ) : null}
              {agente2Social.socialOtro ? (
                <SocialCircle href={agente2Social.socialOtro} label="Enlace" onClick={() => trackSocial("other")}>
                  <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
                </SocialCircle>
              ) : null}
            </div>
          ) : null}
        </CardShell>
      ) : null}

      {hasQuickActions ? (
        <div className="mt-1 border-t pt-3" style={{ borderColor: BORDER }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: BRONZE }}>
            {p.quickActionsLabel}
          </p>
          <div className="space-y-1.5">
            {cr.showLlamar && cr.llamarHref ? (
              <a
                href={cr.llamarHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg px-2 py-2.5 text-[13px] font-bold text-[#F9F6F1] shadow-sm transition hover:brightness-[1.02] lg:min-h-0"
                style={{ background: `linear-gradient(180deg, ${BURGUNDY} 0%, #5A2222 100%)` }}
                onClick={() => track(trackBrPhoneClickGlobal)}
              >
                {p.llamar}
              </a>
            ) : null}
            {cr.showWhatsapp && cr.whatsappHref ? (
              <a
                href={cr.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border bg-white/70 px-2 py-2 text-[13px] font-semibold transition hover:bg-white lg:min-h-0"
                style={{ borderColor: "rgba(37,211,102,0.35)", color: "#128C7E" }}
                onClick={() => track(trackBrWhatsAppClickGlobal)}
              >
                {p.whatsapp}
              </a>
            ) : null}
            {cr.showSolicitarInformacion && cr.solicitarInfoHref ? (
              <a
                href={cr.solicitarInfoHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold lg:min-h-0"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                onClick={() => track(trackBrRequestInfoClickGlobal)}
              >
                {p.solicitarInfo}
              </a>
            ) : null}
            {cr.showProgramarVisita && cr.programarVisitaHref ? (
              <a
                href={cr.programarVisitaHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold lg:min-h-0"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                {...(cr.programarVisitaHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => track(trackBrScheduleVisitClickGlobal)}
              >
                {p.programarVisita}
              </a>
            ) : null}
            {cr.showVerSitioWeb && cr.verSitioWebHref ? (
              <a
                href={cr.verSitioWebHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                onClick={() => track(trackBrWebsiteClickGlobal)}
              >
                {p.verSitioWeb}
              </a>
            ) : null}
            {cr.showVerListado && cr.verListadoHref ? (
              <a
                href={cr.verListadoHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold transition hover:bg-[rgba(197,160,89,0.06)] lg:min-h-0"
                style={{ borderColor: `${BRONZE}99`, color: BRONZE }}
                {...openInNewTabAnchorProps()}
              >
                {p.verListado}
              </a>
            ) : null}
            {cr.showVerMls && cr.verMlsHref ? (
              <a
                href={cr.verMlsHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                {...openInNewTabAnchorProps()}
                onClick={() => track(trackBrMlsClickGlobal)}
              >
                {p.verMls}
              </a>
            ) : null}
            {cr.showVerTour && cr.verTourHref ? (
              <a
                href={cr.verTourHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                {...openInNewTabAnchorProps()}
                onClick={() => track((ctx) => trackBrTourVideoClickGlobal(ctx, "tour"))}
              >
                {p.verTour}
              </a>
            ) : null}
            {cr.showVerFolleto && cr.verFolletoHref ? (
              <a
                href={cr.verFolletoHref}
                className="flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-bold lg:min-h-0 lg:py-1.5"
                style={{ borderColor: BORDER, color: CHARCOAL }}
                {...openInNewTabAnchorProps()}
                onClick={() => track(trackBrBrochureClickGlobal)}
              >
                {p.verFolleto}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
