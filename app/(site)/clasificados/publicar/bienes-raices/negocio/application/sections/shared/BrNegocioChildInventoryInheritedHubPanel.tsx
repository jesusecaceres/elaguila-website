"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { aiCardClass, aiSubClass, aiTitleClass } from "../../../agente-individual/application/formPrimitives";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";
import { additionalBusinessLinks } from "../../../agente-individual/lib/agenteResidencialPreviewFormat";
import { formatUsPhoneDisplay, digitsOnly } from "../../../agente-individual/application/utils/phoneMask";
import { copyToClipboard } from "@/app/components/cta";

function trim(v: string | undefined | null): string {
  return (v ?? "").trim();
}

function friendlyLinkLabel(url: string, fallback: string): string {
  const raw = url.trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./i, "") || fallback;
  } catch {
    return fallback;
  }
}

function HubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-[#1E1810]">{value}</dd>
    </div>
  );
}

function HubEmailRow({ label, email, copyLabel }: { label: string; email: string; copyLabel: string }) {
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

function HubLinkRow({ label, href, linkLabel }: { label: string; href: string; linkLabel: string }) {
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

function HubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{title}</p>
      <dl className="mt-3 space-y-3">{children}</dl>
    </div>
  );
}

function HubImage({ label, src }: { label: string; src: string }) {
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

/** Read-only inherited parent hub (step 7) for child inventory editor. */
export function BrNegocioChildInventoryInheritedHubPanel({
  state,
}: {
  state: AgenteIndividualResidencialFormState;
}) {
  const { t, lang } = useBrAgenteResidencialCopy();
  const s7 = t.step07;
  const locale = lang === "en" ? "en" : "es";

  const inheritedNote =
    lang === "es"
      ? "Esta información se hereda de la aplicación principal y se usará para esta propiedad."
      : "This information is inherited from the main application and will be used for this property.";

  const copyEmailLabel = lang === "es" ? "Copiar" : "Copy";

  const businessLinks = useMemo(() => additionalBusinessLinks(state, locale), [state, locale]);

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

  const hasAgentBlock =
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
    trim(state.agenteFotoDataUrl);

  const hasBrandBlock =
    state.mostrarMarcaEnTarjeta &&
    (trim(state.marcaNombre) ||
      trim(state.marcaLicencia) ||
      trim(state.marcaSitioWeb) ||
      trim(state.marcaLogoDataUrl));

  const hasBrokerBlock =
    trim(state.brokerNombre) ||
    trim(state.brokerTitulo) ||
    trim(state.brokerLicencia) ||
    brokerPhonePersonal ||
    brokerPhoneOffice ||
    brokerWhatsapp ||
    trim(state.brokerEmail) ||
    trim(state.brokerSitioWeb) ||
    trim(state.brokerFotoDataUrl);

  const hasSecondAgent =
    state.mostrarSegundoAgente &&
    (trim(state.agente2Nombre) ||
      trim(state.agente2Titulo) ||
      trim(state.agente2Correo) ||
      trim(state.agente2TelefonoPersonal));

  const hasAnyContent =
    hasAgentBlock || hasBrandBlock || socialRows.length > 0 || businessLinks.length > 0 || hasBrokerBlock || hasSecondAgent;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s7.title}</h2>
      <p className={aiSubClass}>{inheritedNote}</p>
      <p className="mt-3 rounded-lg border border-[#C9B46A]/35 bg-[#FFF6E7] px-3 py-2 text-xs font-medium text-[#5C5346]">
        {lang === "es" ? "Solo lectura — heredado del anuncio principal." : "Read-only — inherited from the main listing."}
      </p>

      {!hasAnyContent ? (
        <p className="mt-4 text-sm text-[#5C5346]/85">
          {lang === "es" ? "Completa el paso 7 en el formulario principal." : "Complete step 7 on the main form."}
        </p>
      ) : null}

      {hasAgentBlock ? (
        <HubSection title={s7.agente}>
          <HubImage label={s7.fotoAgente} src={state.agenteFotoDataUrl} />
          {trim(state.agenteNombre) ? <HubRow label={s7.nombre} value={state.agenteNombre} /> : null}
          {trim(state.agenteTitulo) ? <HubRow label={s7.titulo} value={state.agenteTitulo} /> : null}
          {trim(state.agenteLicencia) ? <HubRow label={s7.licencia} value={state.agenteLicencia} /> : null}
          {trim(state.agenteAreaServicio) ? <HubRow label={s7.areaServicio} value={state.agenteAreaServicio} /> : null}
          {trim(state.agenteIdiomas) ? <HubRow label={s7.idiomas} value={state.agenteIdiomas} /> : null}
          {trim(state.correoPrincipal) ? (
            <HubEmailRow label={s7.correoAgente} email={state.correoPrincipal.trim()} copyLabel={copyEmailLabel} />
          ) : null}
          {personalPhone ? <HubRow label={s7.telefonoPersonal} value={personalPhone} /> : null}
          {officePhone ? <HubRow label={s7.telefonoOficina} value={officePhone} /> : null}
          {whatsapp ? <HubRow label={s7.whatsapp} value={whatsapp} /> : null}
          {personalPhone && officePhone ? (
            <HubRow label={s7.numeroPrincipalLlamadas} value={primaryCallLabel} />
          ) : null}
          {trim(state.agenteSitioWeb) ? (
            <HubLinkRow
              label={s7.sitioWebAgente}
              href={state.agenteSitioWeb.trim()}
              linkLabel={friendlyLinkLabel(state.agenteSitioWeb, lang === "es" ? "Sitio web" : "Website")}
            />
          ) : null}
        </HubSection>
      ) : null}

      {hasBrandBlock ? (
        <HubSection title={s7.oficina}>
          <HubImage label={s7.logo} src={state.marcaLogoDataUrl} />
          {trim(state.marcaNombre) ? <HubRow label={s7.nombreMarca} value={state.marcaNombre} /> : null}
          {trim(state.marcaLicencia) ? <HubRow label={s7.licenciaMarca} value={state.marcaLicencia} /> : null}
          {trim(state.marcaSitioWeb) ? (
            <HubLinkRow
              label={s7.sitioMarca}
              href={state.marcaSitioWeb.trim()}
              linkLabel={friendlyLinkLabel(state.marcaSitioWeb, lang === "es" ? "Sitio de la oficina" : "Office website")}
            />
          ) : null}
        </HubSection>
      ) : null}

      {socialRows.length ? (
        <HubSection title={s7.redes}>
          {socialRows.map((row) => (
            <HubLinkRow
              key={row.label}
              label={row.label}
              href={row.value}
              linkLabel={friendlyLinkLabel(row.value, row.label)}
            />
          ))}
        </HubSection>
      ) : null}

      {businessLinks.length ? (
        <HubSection title={s7.enlacesNegocio}>
          {businessLinks.map((link) => (
            <HubLinkRow key={link.href} label={link.label} href={link.href} linkLabel={link.label} />
          ))}
        </HubSection>
      ) : null}

      {trim(state.ctaEnlaceProgramarVisita) ? (
        <HubSection title={s7.enlaceProgramarVisita}>
          <HubLinkRow
            label={s7.enlaceProgramarVisita}
            href={state.ctaEnlaceProgramarVisita.trim()}
            linkLabel={lang === "es" ? "Abrir enlace de visitas" : "Open scheduling link"}
          />
        </HubSection>
      ) : null}

      {hasBrokerBlock ? (
        <HubSection title={s7.brokerSection}>
          <HubImage label={s7.brokerFoto} src={state.brokerFotoDataUrl} />
          {trim(state.brokerNombre) ? <HubRow label={s7.brokerNombre} value={state.brokerNombre} /> : null}
          {trim(state.brokerTitulo) ? <HubRow label={s7.brokerTitulo} value={state.brokerTitulo} /> : null}
          {trim(state.brokerLicencia) ? <HubRow label={s7.brokerLicencia} value={state.brokerLicencia} /> : null}
          {trim(state.brokerEmail) ? (
            <HubEmailRow label={s7.brokerEmail} email={state.brokerEmail.trim()} copyLabel={copyEmailLabel} />
          ) : null}
          {brokerPhonePersonal ? <HubRow label={s7.telefonoPersonal} value={brokerPhonePersonal} /> : null}
          {brokerPhoneOffice ? <HubRow label={s7.telefonoOficina} value={brokerPhoneOffice} /> : null}
          {brokerWhatsapp ? <HubRow label={s7.whatsapp} value={brokerWhatsapp} /> : null}
          {trim(state.brokerSitioWeb) ? (
            <HubLinkRow
              label={s7.brokerSitioWeb}
              href={state.brokerSitioWeb.trim()}
              linkLabel={friendlyLinkLabel(state.brokerSitioWeb, lang === "es" ? "Sitio web" : "Website")}
            />
          ) : null}
        </HubSection>
      ) : null}

      {hasSecondAgent ? (
        <HubSection title={s7.segundoAgente}>
          <HubImage label={s7.agente2Foto} src={state.agente2FotoDataUrl} />
          {trim(state.agente2Nombre) ? <HubRow label={s7.agente2Nombre} value={state.agente2Nombre} /> : null}
          {trim(state.agente2Titulo) ? <HubRow label={s7.agente2Titulo} value={state.agente2Titulo} /> : null}
          {trim(state.agente2Licencia) ? <HubRow label={s7.agente2Licencia} value={state.agente2Licencia} /> : null}
          {trim(state.agente2Correo) ? (
            <HubEmailRow label={s7.agente2Correo} email={state.agente2Correo.trim()} copyLabel={copyEmailLabel} />
          ) : null}
          {trim(state.agente2TelefonoPersonal) ? (
            <HubRow
              label={s7.telefonoPersonal}
              value={formatUsPhoneDisplay(digitsOnly(state.agente2TelefonoPersonal))}
            />
          ) : null}
        </HubSection>
      ) : null}
    </section>
  );
}
