import type { ReactNode } from "react";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import {
  hasAmenityOptionsResolved,
  hasBusinessHighlightsResolved,
  hasCredentialsResolved,
  hasMainColumnServiceAreasResolved,
  hasPaymentMethodsResolved,
  hasQuickFactsResolved,
  hasTrustSectionResolved,
} from "../lib/serviciosProfilePresence";
import { buildServiciosSmartTrustSummary } from "../lib/serviciosSmartTrustSummary";
import { collectServiciosLanguageLabelsFromProfile } from "../lib/serviciosLanguageChips";
import { LX_CHIP, LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";
import { ServiciosCredencialesCard } from "./ServiciosCredencialesCard";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";
import { ServiciosLanguageChipRow } from "./ServiciosLanguageChipRow";
import { ServiciosOpcionesFacilidadesCard } from "./ServiciosOpcionesFacilidadesCard";
import { ServiciosPagosCard } from "./ServiciosPagosCard";
import { ServiciosHighlightsSection } from "./ServiciosHighlightsSection";
import { FiHome, FiMapPin } from "react-icons/fi";

function CanvasGroup({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className={`${LX_SECTION_CARD} p-4 sm:p-5`}>
      <h3 id={id} className={`${LX_SECTION_HEADING} text-base md:text-lg`}>
        {title}
      </h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export function hasServiciosPublicDetailsCanvas(profile: ServiciosProfileResolved): boolean {
  const hasTrustGroup =
    hasCredentialsResolved(profile) ||
    hasTrustSectionResolved(profile) ||
    hasQuickFactsResolved(profile) ||
    Boolean(buildServiciosSmartTrustSummary(profile, "es") || buildServiciosSmartTrustSummary(profile, "en"));

  const hasHowGroup =
    hasAmenityOptionsResolved(profile) ||
    hasMainColumnServiceAreasResolved(profile) ||
    collectServiciosLanguageLabelsFromProfile(profile.hero).length > 0;

  const hasPaymentsGroup =
    hasPaymentMethodsResolved(profile) || hasBusinessHighlightsResolved(profile);

  return hasTrustGroup || hasHowGroup || hasPaymentsGroup;
}

export function ServiciosPublicDetailsCanvas({
  profile,
  displayProfile,
  lang,
  template,
}: {
  profile: ServiciosProfileResolved;
  displayProfile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template?: ServiciosListingTemplate;
}) {
  if (!hasServiciosPublicDetailsCanvas(profile)) return null;

  const trustTitle = lang === "en" ? "Trust & credentials" : "Confianza y credenciales";
  const howTitle = lang === "en" ? "How this business works" : "Cómo trabaja este negocio";
  const paymentsTitle = lang === "en" ? "Payments & benefits" : "Pagos y beneficios";
  const canvasTitle =
    lang === "en" ? "Services, trust & details" : "Servicios, confianza y detalles";
  const areasLabel = lang === "en" ? "Service areas" : "Áreas de servicio";

  const showTrustGroup =
    hasCredentialsResolved(profile) ||
    hasTrustSectionResolved(profile) ||
    hasQuickFactsResolved(profile) ||
    Boolean(buildServiciosSmartTrustSummary(profile, lang));

  const showHowGroup =
    hasAmenityOptionsResolved(profile) ||
    hasMainColumnServiceAreasResolved(profile) ||
    collectServiciosLanguageLabelsFromProfile(profile.hero).length > 0;

  const showPaymentsGroup =
    hasPaymentMethodsResolved(profile) || hasBusinessHighlightsResolved(profile);

  return (
    <section
      className="scroll-mt-24 space-y-4 sm:space-y-5"
      aria-labelledby="servicios-public-details-canvas-heading"
      data-servicios-public-details-canvas="1"
    >
      <div className="max-w-2xl">
        <h2 id="servicios-public-details-canvas-heading" className={LX_SECTION_HEADING}>
          {canvasTitle}
        </h2>
      </div>

      {showTrustGroup ? (
        <CanvasGroup title={trustTitle} id="servicios-canvas-trust">
          {hasCredentialsResolved(profile) ? (
            <ServiciosCredencialesCard profile={profile} lang={lang} embedded />
          ) : null}
          {hasTrustSectionResolved(profile) ? (
            <ServiciosTrustSection profile={profile} lang={lang} template={template} embedded />
          ) : null}
          {hasQuickFactsResolved(profile) ? (
            <ServiciosQuickFacts facts={profile.quickFacts} lang={lang} compact />
          ) : null}
          <ServiciosSmartTrustSummary profile={profile} lang={lang} />
        </CanvasGroup>
      ) : null}

      {showHowGroup ? (
        <CanvasGroup title={howTitle} id="servicios-canvas-how">
          <ServiciosLanguageChipRow
            profile={profile.hero}
            lang={lang}
            chipClassName={`${LX_CHIP} shrink-0`}
            className="flex flex-wrap gap-1.5"
          />
          {hasAmenityOptionsResolved(profile) ? (
            <ServiciosOpcionesFacilidadesCard profile={profile} lang={lang} compact embedded />
          ) : null}
          {hasMainColumnServiceAreasResolved(profile) ? (
            <div>
              <p className="text-sm font-semibold text-[#1E1814]">{areasLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.serviceAreas.items.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#3B66AD]/20 bg-[#3B66AD]/[0.06] px-3 py-1.5 text-xs font-medium text-[#1E1814]"
                  >
                    {a.kind === "neighborhood" ? (
                      <FiHome className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
                    ) : (
                      <FiMapPin className="h-3.5 w-3.5 text-[#3B66AD]" aria-hidden />
                    )}
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CanvasGroup>
      ) : null}

      {showPaymentsGroup ? (
        <CanvasGroup title={paymentsTitle} id="servicios-canvas-payments">
          {hasPaymentMethodsResolved(profile) ? (
            <ServiciosPagosCard profile={profile} lang={lang} compact embedded />
          ) : null}
          {hasBusinessHighlightsResolved(profile) ? (
            <ServiciosHighlightsSection highlights={displayProfile.highlights} lang={lang} compact embedded />
          ) : null}
        </CanvasGroup>
      ) : null}
    </section>
  );
}
