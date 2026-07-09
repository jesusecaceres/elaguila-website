import type { ReactNode } from "react";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import {
  hasCredentialsResolved,
  hasQuickFactsResolved,
  hasTrustSectionResolved,
} from "../lib/serviciosProfilePresence";
import { buildServiciosSmartTrustSummary } from "../lib/serviciosSmartTrustSummary";
import { LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";
import { ServiciosCredencialesCard } from "./ServiciosCredencialesCard";
import { ServiciosTrustSection } from "./ServiciosTrustSection";
import { ServiciosQuickFacts } from "./ServiciosQuickFacts";
import { ServiciosSmartTrustSummary } from "./ServiciosSmartTrustSummary";

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
  return (
    hasCredentialsResolved(profile) ||
    hasTrustSectionResolved(profile) ||
    hasQuickFactsResolved(profile) ||
    Boolean(buildServiciosSmartTrustSummary(profile, "es") || buildServiciosSmartTrustSummary(profile, "en"))
  );
}

/** Credentials / trust / persuasive stack only — how/payments moved to Restaurante-style sections (SVC-SHELL-2D). */
export function ServiciosPublicDetailsCanvas({
  profile,
  displayProfile: _displayProfile,
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
  const canvasTitle =
    lang === "en" ? "Services, trust & details" : "Servicios, confianza y detalles";

  const showTrustGroup =
    hasCredentialsResolved(profile) ||
    hasTrustSectionResolved(profile) ||
    hasQuickFactsResolved(profile) ||
    Boolean(buildServiciosSmartTrustSummary(profile, lang));

  return (
    <section
      className="scroll-mt-24 space-y-3 md:space-y-5"
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
    </section>
  );
}
