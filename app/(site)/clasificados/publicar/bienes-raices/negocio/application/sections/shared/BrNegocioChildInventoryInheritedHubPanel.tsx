"use client";

import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { aiCardClass, aiSubClass, aiTitleClass } from "../../../agente-individual/application/formPrimitives";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";
import { formatUsPhoneDisplay, digitsOnly } from "../../../agente-individual/application/utils/phoneMask";
import {
  HubEmailRow,
  HubImage,
  HubLinkRow,
  HubRow,
  HubSection,
  friendlyLinkLabel,
  inheritedHubEmptyMessage,
  inheritedHubStep7EmptyHint,
  inheritedSummarySubtext,
  inheritedSummaryTitle,
  useInheritedHubModel,
} from "./brNegocioChildInheritedHubShared";

function trim(v: string | undefined | null): string {
  return (v ?? "").trim();
}

function InheritedHubFields({
  state,
  model,
  lang,
  s7,
  compact = false,
}: {
  state: AgenteIndividualResidencialFormState;
  model: ReturnType<typeof useInheritedHubModel>;
  lang: "es" | "en";
  s7: ReturnType<typeof useBrAgenteResidencialCopy>["t"]["step07"];
  compact?: boolean;
}) {
  const gridClass = compact ? "mt-3 grid gap-2 sm:grid-cols-2" : "";
  const wrap = (children: React.ReactNode) =>
    compact ? <div className={gridClass}>{children}</div> : <>{children}</>;

  const agentRows = (
    <>
      {compact && trim(state.agenteFotoDataUrl) ? (
        <div className="sm:col-span-2">
          <HubImage label={s7.fotoAgente} src={state.agenteFotoDataUrl} />
        </div>
      ) : null}
      {!compact ? <HubImage label={s7.fotoAgente} src={state.agenteFotoDataUrl} /> : null}
      {trim(state.agenteNombre) ? <HubRow label={s7.nombre} value={state.agenteNombre} /> : null}
      {trim(state.agenteTitulo) ? <HubRow label={s7.titulo} value={state.agenteTitulo} /> : null}
      {trim(state.agenteLicencia) ? <HubRow label={s7.licencia} value={state.agenteLicencia} /> : null}
      {trim(state.agenteAreaServicio) ? <HubRow label={s7.areaServicio} value={state.agenteAreaServicio} /> : null}
      {trim(state.agenteIdiomas) ? <HubRow label={s7.idiomas} value={state.agenteIdiomas} /> : null}
      {trim(state.correoPrincipal) ? (
        <HubEmailRow label={s7.correoAgente} email={state.correoPrincipal.trim()} copyLabel={model.copyEmailLabel} />
      ) : null}
      {model.personalPhone ? <HubRow label={s7.telefonoPersonal} value={model.personalPhone} /> : null}
      {model.officePhone ? <HubRow label={s7.telefonoOficina} value={model.officePhone} /> : null}
      {model.whatsapp ? <HubRow label={s7.whatsapp} value={model.whatsapp} /> : null}
      {model.personalPhone && model.officePhone ? (
        <HubRow label={s7.numeroPrincipalLlamadas} value={model.primaryCallLabel} />
      ) : null}
      {trim(state.agenteSitioWeb) ? (
        <HubLinkRow
          label={s7.sitioWebAgente}
          href={state.agenteSitioWeb.trim()}
          linkLabel={friendlyLinkLabel(state.agenteSitioWeb, lang === "es" ? "Sitio web" : "Website")}
        />
      ) : null}
    </>
  );

  return (
    <>
      {model.hasAgentBlock ? (
        compact ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.agente}</p>
            {wrap(agentRows)}
          </div>
        ) : (
          <HubSection title={s7.agente}>{agentRows}</HubSection>
        )
      ) : null}

      {model.hasBrandBlock ? (
        compact ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.oficina}</p>
            <div className={gridClass || "mt-3 space-y-3"}>
              {trim(state.marcaLogoDataUrl) ? <HubImage label={s7.logo} src={state.marcaLogoDataUrl} /> : null}
              {trim(state.marcaNombre) ? <HubRow label={s7.nombreMarca} value={state.marcaNombre} /> : null}
              {trim(state.marcaLicencia) ? <HubRow label={s7.licenciaMarca} value={state.marcaLicencia} /> : null}
              {trim(state.marcaSitioWeb) ? (
                <HubLinkRow
                  label={s7.sitioMarca}
                  href={state.marcaSitioWeb.trim()}
                  linkLabel={friendlyLinkLabel(state.marcaSitioWeb, lang === "es" ? "Sitio de la oficina" : "Office website")}
                />
              ) : null}
            </div>
          </div>
        ) : (
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
        )
      ) : null}

      {model.socialRows.length ? (
        compact ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.redes}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {model.socialRows.map((row) => (
                <HubLinkRow
                  key={row.label}
                  label={row.label}
                  href={row.value}
                  linkLabel={friendlyLinkLabel(row.value, row.label)}
                />
              ))}
            </div>
          </div>
        ) : (
          <HubSection title={s7.redes}>
            {model.socialRows.map((row) => (
              <HubLinkRow
                key={row.label}
                label={row.label}
                href={row.value}
                linkLabel={friendlyLinkLabel(row.value, row.label)}
              />
            ))}
          </HubSection>
        )
      ) : null}

      {model.businessLinks.length ? (
        compact ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.enlacesNegocio}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {model.businessLinks.map((link) => (
                <HubLinkRow key={link.href} label={link.label} href={link.href} linkLabel={link.label} />
              ))}
            </div>
          </div>
        ) : (
          <HubSection title={s7.enlacesNegocio}>
            {model.businessLinks.map((link) => (
              <HubLinkRow key={link.href} label={link.label} href={link.href} linkLabel={link.label} />
            ))}
          </HubSection>
        )
      ) : null}

      {trim(state.ctaEnlaceProgramarVisita) ? (
        compact ? (
          <div className="mt-4">
            <HubLinkRow
              label={s7.enlaceProgramarVisita}
              href={state.ctaEnlaceProgramarVisita.trim()}
              linkLabel={lang === "es" ? "Abrir enlace de visitas" : "Open scheduling link"}
            />
          </div>
        ) : (
          <HubSection title={s7.enlaceProgramarVisita}>
            <HubLinkRow
              label={s7.enlaceProgramarVisita}
              href={state.ctaEnlaceProgramarVisita.trim()}
              linkLabel={lang === "es" ? "Abrir enlace de visitas" : "Open scheduling link"}
            />
          </HubSection>
        )
      ) : null}

      {model.hasBrokerBlock ? (
        compact ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.brokerSection}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {trim(state.brokerNombre) ? <HubRow label={s7.brokerNombre} value={state.brokerNombre} /> : null}
              {trim(state.brokerTitulo) ? <HubRow label={s7.brokerTitulo} value={state.brokerTitulo} /> : null}
              {trim(state.brokerLicencia) ? <HubRow label={s7.brokerLicencia} value={state.brokerLicencia} /> : null}
              {trim(state.brokerEmail) ? (
                <HubEmailRow label={s7.brokerEmail} email={state.brokerEmail.trim()} copyLabel={model.copyEmailLabel} />
              ) : null}
              {model.brokerPhonePersonal ? <HubRow label={s7.telefonoPersonal} value={model.brokerPhonePersonal} /> : null}
              {model.brokerPhoneOffice ? <HubRow label={s7.telefonoOficina} value={model.brokerPhoneOffice} /> : null}
              {model.brokerWhatsapp ? <HubRow label={s7.whatsapp} value={model.brokerWhatsapp} /> : null}
              {trim(state.brokerSitioWeb) ? (
                <HubLinkRow
                  label={s7.brokerSitioWeb}
                  href={state.brokerSitioWeb.trim()}
                  linkLabel={friendlyLinkLabel(state.brokerSitioWeb, lang === "es" ? "Sitio web" : "Website")}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <HubSection title={s7.brokerSection}>
            <HubImage label={s7.brokerFoto} src={state.brokerFotoDataUrl} />
            {trim(state.brokerNombre) ? <HubRow label={s7.brokerNombre} value={state.brokerNombre} /> : null}
            {trim(state.brokerTitulo) ? <HubRow label={s7.brokerTitulo} value={state.brokerTitulo} /> : null}
            {trim(state.brokerLicencia) ? <HubRow label={s7.brokerLicencia} value={state.brokerLicencia} /> : null}
            {trim(state.brokerEmail) ? (
              <HubEmailRow label={s7.brokerEmail} email={state.brokerEmail.trim()} copyLabel={model.copyEmailLabel} />
            ) : null}
            {model.brokerPhonePersonal ? <HubRow label={s7.telefonoPersonal} value={model.brokerPhonePersonal} /> : null}
            {model.brokerPhoneOffice ? <HubRow label={s7.telefonoOficina} value={model.brokerPhoneOffice} /> : null}
            {model.brokerWhatsapp ? <HubRow label={s7.whatsapp} value={model.brokerWhatsapp} /> : null}
            {trim(state.brokerSitioWeb) ? (
              <HubLinkRow
                label={s7.brokerSitioWeb}
                href={state.brokerSitioWeb.trim()}
                linkLabel={friendlyLinkLabel(state.brokerSitioWeb, lang === "es" ? "Sitio web" : "Website")}
              />
            ) : null}
          </HubSection>
        )
      ) : null}

      {model.hasSecondAgent ? (
        compact ? (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#B8954A]">{s7.segundoAgente}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {trim(state.agente2Nombre) ? <HubRow label={s7.agente2Nombre} value={state.agente2Nombre} /> : null}
              {trim(state.agente2Titulo) ? <HubRow label={s7.agente2Titulo} value={state.agente2Titulo} /> : null}
              {trim(state.agente2Licencia) ? <HubRow label={s7.agente2Licencia} value={state.agente2Licencia} /> : null}
              {trim(state.agente2Correo) ? (
                <HubEmailRow label={s7.agente2Correo} email={state.agente2Correo.trim()} copyLabel={model.copyEmailLabel} />
              ) : null}
              {trim(state.agente2TelefonoPersonal) ? (
                <HubRow
                  label={s7.telefonoPersonal}
                  value={formatUsPhoneDisplay(digitsOnly(state.agente2TelefonoPersonal))}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <HubSection title={s7.segundoAgente}>
            <HubImage label={s7.agente2Foto} src={state.agente2FotoDataUrl} />
            {trim(state.agente2Nombre) ? <HubRow label={s7.agente2Nombre} value={state.agente2Nombre} /> : null}
            {trim(state.agente2Titulo) ? <HubRow label={s7.agente2Titulo} value={state.agente2Titulo} /> : null}
            {trim(state.agente2Licencia) ? <HubRow label={s7.agente2Licencia} value={state.agente2Licencia} /> : null}
            {trim(state.agente2Correo) ? (
              <HubEmailRow label={s7.agente2Correo} email={state.agente2Correo.trim()} copyLabel={model.copyEmailLabel} />
            ) : null}
            {trim(state.agente2TelefonoPersonal) ? (
              <HubRow
                label={s7.telefonoPersonal}
                value={formatUsPhoneDisplay(digitsOnly(state.agente2TelefonoPersonal))}
              />
            ) : null}
          </HubSection>
        )
      ) : null}
    </>
  );
}

/** Compact read-only inherited summary for Step 10 review. */
export function BrNegocioChildInventoryInheritedSummary({
  state,
  lang,
}: {
  state: AgenteIndividualResidencialFormState;
  lang: "es" | "en";
}) {
  const { t } = useBrAgenteResidencialCopy();
  const locale = lang === "en" ? "en" : "es";
  const model = useInheritedHubModel(state, t.step07, locale);

  return (
    <div className="rounded-xl border border-[#C9B46A]/40 bg-[#FFF6E7]/80 px-4 py-4">
      <h4 className="text-sm font-bold text-[#1E1810]">{inheritedSummaryTitle(lang)}</h4>
      <p className="mt-1 text-xs leading-relaxed text-[#5C5346]/90">{inheritedSummarySubtext(lang)}</p>
      <p className="mt-2 rounded-lg border border-[#C9B46A]/30 bg-white/70 px-3 py-2 text-[11px] font-medium text-[#5C5346]">
        {lang === "es" ? "Solo lectura — heredado del anuncio principal." : "Read-only — inherited from the main listing."}
      </p>
      {!model.hasAnyContent ? (
        <p className="mt-3 rounded-lg border border-[#FECDCA]/80 bg-[#FEF3F2] px-3 py-3 text-sm leading-snug text-[#B42318]">
          {inheritedHubEmptyMessage(lang)}
        </p>
      ) : (
        <div className="mt-3">
          <InheritedHubFields state={state} model={model} lang={lang} s7={t.step07} compact />
        </div>
      )}
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
  const model = useInheritedHubModel(state, s7, locale);

  const inheritedNote =
    lang === "es"
      ? "Esta información se hereda de la aplicación principal y se usará para esta propiedad."
      : "This information is inherited from the main application and will be used for this property.";

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s7.title}</h2>
      <p className={aiSubClass}>{inheritedNote}</p>
      <p className="mt-3 rounded-lg border border-[#C9B46A]/35 bg-[#FFF6E7] px-3 py-2 text-xs font-medium text-[#5C5346]">
        {lang === "es" ? "Solo lectura — heredado del anuncio principal." : "Read-only — inherited from the main listing."}
      </p>

      {!model.hasAnyContent ? (
        <div className="mt-4 space-y-2 rounded-lg border border-[#FECDCA]/80 bg-[#FEF3F2] px-4 py-3">
          <p className="text-sm font-semibold text-[#B42318]">{inheritedHubEmptyMessage(lang)}</p>
          <p className="text-sm leading-relaxed text-[#5C5346]/90">{inheritedHubStep7EmptyHint(lang)}</p>
        </div>
      ) : (
        <InheritedHubFields state={state} model={model} lang={lang} s7={s7} />
      )}
    </section>
  );
}
