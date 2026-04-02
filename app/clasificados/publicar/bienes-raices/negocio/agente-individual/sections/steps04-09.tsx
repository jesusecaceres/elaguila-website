"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTextareaClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { digitsOnly, formatUsPhoneDisplay, onPhoneInputChange } from "../application/utils/phoneMask";
import type { BrAgenteResidencialCopy } from "../application/brAgenteResidencialCopy";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import { labelDestacadoForPublishStep } from "../lib/agenteResidencialPreviewFormat";

export function Step04DetallesEsenciales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const c = t.previewFormat.condicion;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step04.title}</h2>
      <p className={aiSubClass}>{t.step04.sub}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label={t.step04.recamaras}>
          <input
            className={aiInputClass}
            value={state.recamaras}
            onChange={(e) => setState((s) => ({ ...s, recamaras: e.target.value }))}
            inputMode="numeric"
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.banos}>
          <input className={aiInputClass} value={state.banos} onChange={(e) => setState((s) => ({ ...s, banos: e.target.value }))} autoComplete="off" />
        </AiField>
        <AiField label={t.step04.mediosBanos} hint={t.step04.mediosHint}>
          <input
            className={aiInputClass}
            value={state.mediosBanos}
            onChange={(e) => setState((s) => ({ ...s, mediosBanos: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.tamanoInterior} hint={t.step04.tamanoInteriorHint}>
          <input
            className={aiInputClass}
            value={state.tamanoInteriorSqft}
            onChange={(e) => setState((s) => ({ ...s, tamanoInteriorSqft: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.tamanoLote} hint={t.step04.tamanoLoteHint}>
          <input
            className={aiInputClass}
            value={state.tamanoLoteSqft}
            onChange={(e) => setState((s) => ({ ...s, tamanoLoteSqft: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.estacionamientos}>
          <input
            className={aiInputClass}
            value={state.estacionamientos}
            onChange={(e) => setState((s) => ({ ...s, estacionamientos: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.ano}>
          <input
            className={aiInputClass}
            value={state.anoConstruccion}
            onChange={(e) => setState((s) => ({ ...s, anoConstruccion: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step04.condicion} hint={t.step04.condicionHint}>
          <select
            className={aiInputClass}
            value={state.condicionPropiedad}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                condicionPropiedad: e.target.value as AgenteIndividualResidencialFormState["condicionPropiedad"],
              }))
            }
          >
            <option value="excelente">{c.excelente}</option>
            <option value="buena">{c.buena}</option>
            <option value="regular">{c.regular}</option>
            <option value="necesita_reparacion">{c.necesita_reparacion}</option>
          </select>
        </AiField>
      </div>
    </section>
  );
}

export function Step05Caracteristicas({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { lang, t } = useBrAgenteResidencialCopy();
  const loc = lang === "en" ? "en" : "es";

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step05.title}</h2>
      <p className={aiSubClass}>{t.step05.sub}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {AGENTE_RES_DESTACADOS_DEFS.map((def) => (
          <label key={def.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
              checked={Boolean(state.destacados[def.id])}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  destacados: { ...s.destacados, [def.id]: e.target.checked },
                }))
              }
            />
            {labelDestacadoForPublishStep(def.id, loc)}
          </label>
        ))}
      </div>
    </section>
  );
}

export function Step06Descripcion({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step06.title}</h2>
      <div className="mt-5 space-y-4">
        <AiField label={t.step06.principal}>
          <textarea
            className={aiTextareaClass}
            value={state.descripcionPrincipal}
            onChange={(e) => setState((s) => ({ ...s, descripcionPrincipal: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label={t.step06.notas} hint={t.step06.notasHint}>
          <textarea
            className={aiTextareaClass}
            value={state.notasAdicionales}
            onChange={(e) => setState((s) => ({ ...s, notasAdicionales: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
      </div>
    </section>
  );
}

function PhotoOrFileRow({
  label,
  hint,
  value,
  onChange,
  subirImagen,
  pegarUrlImagen,
  quitar,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  subirImagen: string;
  pegarUrlImagen: string;
  quitar: string;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
          {subirImagen}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f?.type.startsWith("image/")) return;
              void readFileAsDataUrl(f).then((url) => onChange(url));
            }}
          />
        </label>
        <input
          className={`${aiInputClass} min-w-[200px] flex-1`}
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={pegarUrlImagen}
          autoComplete="off"
        />
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-24 w-24 rounded-lg border object-cover" />
          <button type="button" className="text-xs font-semibold text-red-800" onClick={() => onChange("")}>
            {quitar}
          </button>
        </div>
      ) : null}
    </AiField>
  );
}

function PhotoOrUrlBlock({
  label,
  hint,
  value,
  onChange,
  subirArchivo,
  pegarUrl,
  quitar,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  subirArchivo: string;
  pegarUrl: string;
  quitar: string;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
          {subirArchivo}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f?.type.startsWith("image/")) return;
              void readFileAsDataUrl(f).then((url) => onChange(url));
            }}
          />
        </label>
        <input
          className={`${aiInputClass} min-w-[200px] flex-1`}
          type="url"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={pegarUrl}
          autoComplete="off"
        />
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-16 rounded-lg border object-cover" />
          <button type="button" className="text-xs font-semibold text-red-800" onClick={() => onChange("")}>
            {quitar}
          </button>
        </div>
      ) : null}
    </AiField>
  );
}

export function Step07InformacionProfesional({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const s7 = t.step07 as BrAgenteResidencialCopy["step07"];
  const quitar = t.step02.quitar;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s7.title}</h2>
      <p className={aiSubClass}>{s7.sub}</p>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.agente}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PhotoOrFileRow
            label={s7.fotoAgente}
            hint={s7.fotoAgenteHint}
            value={state.agenteFotoDataUrl}
            onChange={(v) => setState((s) => ({ ...s, agenteFotoDataUrl: v }))}
            subirImagen={s7.subirImagen}
            pegarUrlImagen={s7.pegarUrlImagen}
            quitar={quitar}
          />
        </div>
        <AiField label={s7.nombre}>
          <input className={aiInputClass} value={state.agenteNombre} onChange={(e) => setState((s) => ({ ...s, agenteNombre: e.target.value }))} autoComplete="name" />
        </AiField>
        <AiField label={s7.titulo}>
          <input
            className={aiInputClass}
            value={state.agenteTitulo}
            onChange={(e) => setState((s) => ({ ...s, agenteTitulo: e.target.value }))}
            autoComplete="organization-title"
          />
        </AiField>
        <AiField label={s7.licencia} hint={s7.licenciaHint}>
          <input className={aiInputClass} value={state.agenteLicencia} onChange={(e) => setState((s) => ({ ...s, agenteLicencia: e.target.value }))} autoComplete="off" />
        </AiField>
      </div>

      <div className="mt-8">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm text-[#2C2416]">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A] text-[#B8954A]"
            checked={state.mostrarMarcaEnTarjeta}
            onChange={(e) => setState((s) => ({ ...s, mostrarMarcaEnTarjeta: e.target.checked }))}
          />
          <span>
            <span className="font-semibold">{s7.mostrarMarca}</span>
            <span className="mt-0.5 block text-xs text-[#5C5346]/90">{s7.mostrarMarcaHint}</span>
          </span>
        </label>
      </div>

      {state.mostrarMarcaEnTarjeta ? (
        <>
          <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.oficina}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <AiField label={s7.nombreMarca}>
              <input className={aiInputClass} value={state.marcaNombre} onChange={(e) => setState((s) => ({ ...s, marcaNombre: e.target.value }))} autoComplete="organization" />
            </AiField>
            <div className="sm:col-span-2">
              <PhotoOrUrlBlock
                label={s7.logo}
                hint={s7.logoHint}
                value={state.marcaLogoDataUrl}
                onChange={(v) => setState((s) => ({ ...s, marcaLogoDataUrl: v }))}
                subirArchivo={s7.subirArchivo}
                pegarUrl={s7.pegarUrl}
                quitar={quitar}
              />
            </div>
            <AiField label={s7.licenciaMarca}>
              <input className={aiInputClass} value={state.marcaLicencia} onChange={(e) => setState((s) => ({ ...s, marcaLicencia: e.target.value }))} autoComplete="off" />
            </AiField>
            <AiField label={s7.sitioMarca} hint={s7.sitioMarcaHint}>
              <input
                className={aiInputClass}
                type="url"
                value={state.marcaSitioWeb}
                onChange={(e) => setState((s) => ({ ...s, marcaSitioWeb: e.target.value }))}
                autoComplete="url"
                placeholder="https://"
              />
            </AiField>
          </div>
        </>
      ) : null}

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.redes}</p>
      <p className="mt-1 text-sm text-[#5C5346]/85">{s7.redesSub}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <AiField label={s7.instagram}>
          <input className={aiInputClass} type="url" value={state.socialInstagram} onChange={(e) => setState((s) => ({ ...s, socialInstagram: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label={s7.facebook}>
          <input className={aiInputClass} type="url" value={state.socialFacebook} onChange={(e) => setState((s) => ({ ...s, socialFacebook: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label={s7.youtube}>
          <input className={aiInputClass} type="url" value={state.socialYoutube} onChange={(e) => setState((s) => ({ ...s, socialYoutube: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label={s7.tiktok}>
          <input className={aiInputClass} type="url" value={state.socialTiktok} onChange={(e) => setState((s) => ({ ...s, socialTiktok: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label={s7.x}>
          <input className={aiInputClass} type="url" value={state.socialX} onChange={(e) => setState((s) => ({ ...s, socialX: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label={s7.otroSocial}>
          <input className={aiInputClass} type="url" value={state.socialOtro} onChange={(e) => setState((s) => ({ ...s, socialOtro: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <AiField label={s7.areaServicio}>
          <input className={aiInputClass} value={state.agenteAreaServicio} onChange={(e) => setState((s) => ({ ...s, agenteAreaServicio: e.target.value }))} autoComplete="off" />
        </AiField>
        <AiField label={s7.idiomas}>
          <input className={aiInputClass} value={state.agenteIdiomas} onChange={(e) => setState((s) => ({ ...s, agenteIdiomas: e.target.value }))} placeholder={s7.idiomasPh} autoComplete="off" />
        </AiField>
      </div>
    </section>
  );
}

type CtaToggleKey =
  | "permitirSolicitarInformacion"
  | "permitirProgramarVisita"
  | "permitirLlamar"
  | "permitirWhatsApp"
  | "permitirVerSitioWeb"
  | "permitirVerRedes"
  | "permitirVerListadoCompleto"
  | "permitirVerMls"
  | "permitirVerTour"
  | "permitirVerFolleto";

export function Step08CtaEnlaces({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const s8 = t.step08;

  const row = (key: CtaToggleKey, label: string) => (
    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
        checked={state[key]}
        onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
      />
      {label}
    </label>
  );

  const maskPhone = (v: string) => formatUsPhoneDisplay(digitsOnly(v));

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s8.title}</h2>
      <p className={aiSubClass}>{s8.sub}</p>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s8.contactoBase}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <AiField label={s8.telefono} hint={s8.telefonoHint}>
          <input
            className={aiInputClass}
            value={maskPhone(state.telefonoPrincipal)}
            onChange={(e) => {
              const prev = digitsOnly(state.telefonoPrincipal);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, telefonoPrincipal: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </AiField>
        <AiField label={s8.correo} hint={s8.correoHint}>
          <input
            type="email"
            className={aiInputClass}
            value={state.correoPrincipal}
            onChange={(e) => setState((s) => ({ ...s, correoPrincipal: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s8.destinos}</p>
      <p className="mt-1 text-xs text-[#5C5346]/85">{s8.destinosSub}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AiField label={s8.numLlamadas} hint={s8.numLlamadasHint}>
          <input
            className={aiInputClass}
            value={maskPhone(state.ctaNumeroLlamadas)}
            onChange={(e) => {
              const prev = digitsOnly(state.ctaNumeroLlamadas);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, ctaNumeroLlamadas: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
          />
        </AiField>
        <AiField label={s8.numWa} hint={s8.numWaHint}>
          <input
            className={aiInputClass}
            value={maskPhone(state.ctaNumeroWhatsapp)}
            onChange={(e) => {
              const prev = digitsOnly(state.ctaNumeroWhatsapp);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, ctaNumeroWhatsapp: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
          />
        </AiField>
        <AiField label={s8.correoInfo} hint={s8.correoInfoHint}>
          <input
            type="email"
            className={aiInputClass}
            value={state.ctaCorreoSolicitarInfo}
            onChange={(e) => setState((s) => ({ ...s, ctaCorreoSolicitarInfo: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
        <AiField label={s8.enlaceVisita} hint={s8.enlaceVisitaHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaEnlaceProgramarVisita}
            onChange={(e) => setState((s) => ({ ...s, ctaEnlaceProgramarVisita: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label={s8.enlaceWeb} hint={s8.enlaceWebHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaEnlaceSitioWeb}
            onChange={(e) => setState((s) => ({ ...s, ctaEnlaceSitioWeb: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label={s8.enlaceListado} hint={s8.enlaceListadoHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlListadoCompleto}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlListadoCompleto: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label={s8.enlaceMls} hint={s8.enlaceMlsHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlMls}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlMls: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label={s8.enlaceTour} hint={s8.enlaceTourHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlTour}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlTour: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label={s8.enlaceFolleto} hint={s8.enlaceFolletoHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlFolleto}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlFolleto: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s8.interruptores}</p>
      <p className="mt-1 text-xs text-[#5C5346]/85">{s8.interruptoresSub}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {row("permitirSolicitarInformacion", s8.ctaSolicitar)}
        {row("permitirProgramarVisita", s8.ctaVisita)}
        {row("permitirLlamar", s8.ctaLlamar)}
        {row("permitirWhatsApp", s8.ctaWa)}
        {row("permitirVerSitioWeb", s8.ctaWeb)}
        {row("permitirVerRedes", s8.ctaRedes)}
        {row("permitirVerListadoCompleto", s8.ctaListado)}
        {row("permitirVerMls", s8.ctaMls)}
        {row("permitirVerTour", s8.ctaTour)}
        {row("permitirVerFolleto", s8.ctaFolleto)}
      </div>
    </section>
  );
}

export function Step09ExtrasOpcionales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const s9 = t.step09;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s9.title}</h2>
      <p className={aiSubClass}>{s9.sub}</p>
      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A]"
              checked={state.extraOpenHouse}
              onChange={(e) => setState((s) => ({ ...s, extraOpenHouse: e.target.checked }))}
            />
            {s9.openHouse}
          </label>
          {state.extraOpenHouse ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label={s9.fecha}>
                <input type="date" className={aiInputClass} value={state.openHouseFecha} onChange={(e) => setState((s) => ({ ...s, openHouseFecha: e.target.value }))} />
              </AiField>
              <AiField label={s9.horaInicio}>
                <input type="time" className={aiInputClass} value={state.openHouseInicio} onChange={(e) => setState((s) => ({ ...s, openHouseInicio: e.target.value }))} />
              </AiField>
              <AiField label={s9.horaFin}>
                <input type="time" className={aiInputClass} value={state.openHouseFin} onChange={(e) => setState((s) => ({ ...s, openHouseFin: e.target.value }))} />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label={s9.notasOh}>
                  <input className={aiInputClass} value={state.openHouseNotas} onChange={(e) => setState((s) => ({ ...s, openHouseNotas: e.target.value }))} />
                </AiField>
              </div>
            </div>
          ) : null}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A]"
              checked={state.extraAsesorFinanciero}
              onChange={(e) => setState((s) => ({ ...s, extraAsesorFinanciero: e.target.checked }))}
            />
            {s9.asesorFin}
          </label>
          {state.extraAsesorFinanciero ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label={s9.nombreAsesor}>
                <input className={aiInputClass} value={state.asesorNombre} onChange={(e) => setState((s) => ({ ...s, asesorNombre: e.target.value }))} autoComplete="name" />
              </AiField>
              <AiField label={s9.telAsesor}>
                <input className={aiInputClass} value={state.asesorTelefono} onChange={(e) => setState((s) => ({ ...s, asesorTelefono: e.target.value }))} autoComplete="tel" />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label={s9.correoAsesor}>
                  <input type="email" className={aiInputClass} value={state.asesorEmail} onChange={(e) => setState((s) => ({ ...s, asesorEmail: e.target.value }))} autoComplete="email" />
                </AiField>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
