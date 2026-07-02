"use client";

import { useCallback, useMemo, useState } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrAgenteResidencialCopy } from "../../../agente-individual/application/brAgenteResidencialCopy";
import { additionalBusinessLinks } from "../../../agente-individual/lib/agenteResidencialPreviewFormat";
import { formatUsPhoneDisplay, digitsOnly } from "../../../agente-individual/application/utils/phoneMask";
import { copyToClipboard } from "@/app/components/cta";

export type BrChildInheritedLang = "es" | "en";

function trim(v: string | undefined | null): string {
  return (v ?? "").trim();
}

export function friendlyLinkLabel(url: string, fallback: string): string {
  const raw = url.trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./i, "") || fallback;
  } catch {
    return fallback;
  }
}

export function inheritedHubEmptyMessage(lang: BrChildInheritedLang): string {
  return lang === "es"
    ? "No se encontró información profesional/de contacto heredada. Regresa a la aplicación principal y completa los pasos de información profesional/contacto antes de guardar esta propiedad."
    : "No inherited professional/contact info was found yet. Go back to the main application and complete the professional/contact steps before saving this property.";
}

export function inheritedHubStep7EmptyHint(lang: BrChildInheritedLang): string {
  return lang === "es"
    ? "Esta sección se hereda del anuncio principal. Si está vacía, cierra esta propiedad, completa el paso 7 (perfil profesional) en el formulario principal y vuelve a agregar o editar la propiedad del inventario."
    : "This section is inherited from the main listing. If it is empty, close this property, complete step 7 (professional profile) on the main form, then return to add or edit this inventory property.";
}

export function inheritedHubStep8EmptyHint(lang: BrChildInheritedLang): string {
  return lang === "es"
    ? "Las acciones de contacto se heredan del anuncio principal. Si no aparece nada, completa teléfono, correo o enlaces en el paso 7 del formulario principal antes de guardar esta propiedad."
    : "Contact actions are inherited from the main listing. If nothing appears, add phone, email, or links in step 7 on the main form before saving this property.";
}

export function inheritedSummaryTitle(lang: BrChildInheritedLang): string {
  return lang === "es" ? "Contacto heredado del anuncio principal" : "Inherited parent contact";
}

export function inheritedSummarySubtext(lang: BrChildInheritedLang): string {
  return lang === "es"
    ? "Esta información proviene del anuncio principal. Si algo está incorrecto, regresa al formulario principal y corrígelo antes de guardar esta propiedad."
    : "This comes from the main listing. If anything is wrong, go back to the main application and update it before saving this property.";
}

export type InheritedHubModel = {
  hasAnyContent: boolean;
  copyEmailLabel: string;
  personalPhone: string;
  officePhone: string;
  whatsapp: string;
  primaryCallLabel: string;
  socialRows: Array<{ label: string; value: string }>;
  businessLinks: Array<{ label: string; href: string }>;
  brokerPhonePersonal: string;
  brokerPhoneOffice: string;
  brokerWhatsapp: string;
  hasAgentBlock: boolean;
  hasBrandBlock: boolean;
  hasBrokerBlock: boolean;
  hasSecondAgent: boolean;
};

export function useInheritedHubModel(
  state: AgenteIndividualResidencialFormState,
  s7: BrAgenteResidencialCopy["step07"],
  locale: BrChildInheritedLang,
): InheritedHubModel {
  return useMemo(() => {
    const businessLinks = additionalBusinessLinks(state, locale);
    const personalPhone = formatUsPhoneDisplay(digitsOnly(state.agenteTelefonoPersonal || state.telefonoPrincipal));
    const officePhone = formatUsPhoneDisplay(digitsOnly(state.agenteTelefonoOficina));
    const whatsapp = formatUsPhoneDisplay(digitsOnly(state.agenteWhatsapp));
    const primaryCallLabel =
      state.agentePrincipalLlamadas === "oficina" ? s7.principalOficina : s7.principalPersonal;
    const socialRows = [
      { label: s7.instagram, value: state.socialInstagram },
      { label: s7.facebook, value: state.socialFacebook },
      { label: s7.youtube, value: state.socialYoutube },
      { label: s7.tiktok, value: state.socialTiktok },
      { label: s7.x, value: state.socialX },
      { label: s7.linkedin, value: state.socialLinkedin },
      { label: s7.snapchat, value: state.socialSnapchat },
      { label: s7.googleReviews, value: state.googleReviewsUrl },
      { label: s7.yelpReviews, value: state.yelpReviewsUrl },
      { label: s7.enlaceSocialAdicional, value: state.socialOtro },
    ].filter((r) => trim(r.value));
    const brokerPhonePersonal = formatUsPhoneDisplay(digitsOnly(state.brokerTelefonoPersonal || state.brokerTelefono));
    const brokerPhoneOffice = formatUsPhoneDisplay(digitsOnly(state.brokerTelefonoOficina));
    const brokerWhatsapp = formatUsPhoneDisplay(digitsOnly(state.brokerWhatsapp));

    const hasAgentBlock = Boolean(
      trim(state.agenteNombre) ||
        trim(state.agenteTitulo) ||
        trim(state.agenteLicencia) ||
        personalPhone ||
        officePhone ||
        whatsapp ||
        trim(state.correoPrincipal) ||
        trim(state.agenteSitioWeb) ||
        trim(state.agenteAreaServicio) ||
        trim(state.agenteIdiomas) ||
        trim(state.agenteFotoDataUrl),
    );

    const hasBrandBlock = Boolean(
      state.mostrarMarcaEnTarjeta &&
        (trim(state.marcaNombre) ||
          trim(state.marcaLicencia) ||
          trim(state.marcaSitioWeb) ||
          trim(state.marcaLogoDataUrl)),
    );

    const hasBrokerBlock = Boolean(
      trim(state.brokerNombre) ||
        trim(state.brokerTitulo) ||
        trim(state.brokerLicencia) ||
        brokerPhonePersonal ||
        brokerPhoneOffice ||
        brokerWhatsapp ||
        trim(state.brokerEmail) ||
        trim(state.brokerSitioWeb) ||
        trim(state.brokerFotoDataUrl),
    );

    const hasSecondAgent = Boolean(
      state.mostrarSegundoAgente &&
        (trim(state.agente2Nombre) ||
          trim(state.agente2Titulo) ||
          trim(state.agente2Correo) ||
          trim(state.agente2TelefonoPersonal)),
    );

    const hasAnyContent = Boolean(
      hasAgentBlock ||
        hasBrandBlock ||
        socialRows.length > 0 ||
        businessLinks.length > 0 ||
        hasBrokerBlock ||
        hasSecondAgent ||
        trim(state.ctaEnlaceProgramarVisita),
    );

    return {
      hasAnyContent,
      copyEmailLabel: locale === "es" ? "Copiar" : "Copy",
      personalPhone,
      officePhone,
      whatsapp,
      primaryCallLabel,
      socialRows,
      businessLinks,
      brokerPhonePersonal,
      brokerPhoneOffice,
      brokerWhatsapp,
      hasAgentBlock,
      hasBrandBlock,
      hasBrokerBlock,
      hasSecondAgent,
    };
  }, [state, s7, locale]);
}

export function HubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-[#1E1810]">{value}</dd>
    </div>
  );
}

export function HubEmailRow({ label, email, copyLabel }: { label: string; email: string; copyLabel: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    const ok = await copyToClipboard(email);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [email]);

  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-center gap-2">
        <a href={`mailto:${email}`} className="break-all text-sm font-semibold text-[#1E1810] underline-offset-2 hover:underline">
          {email}
        </a>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="min-h-[44px] shrink-0 touch-manipulation rounded-lg border border-[#C9B46A]/50 bg-[#FFF6E7] px-3 py-1.5 text-xs font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0"
        >
          {copied ? "✓" : copyLabel}
        </button>
      </dd>
    </div>
  );
}

export function HubLinkRow({ label, href, linkLabel }: { label: string; href: string; linkLabel: string }) {
  const safeHref = href.startsWith("http") ? href : `https://${href}`;
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5">
        <a
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#6E5418] underline-offset-2 hover:underline sm:min-h-0"
        >
          {linkLabel}
        </a>
      </dd>
    </div>
  );
}

export function HubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{title}</p>
      <dl className="mt-3 space-y-3">{children}</dl>
    </div>
  );
}

export function HubImage({ label, src }: { label: string; src: string }) {
  if (!src.trim()) return null;
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
      <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-[#E8DFD0] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
