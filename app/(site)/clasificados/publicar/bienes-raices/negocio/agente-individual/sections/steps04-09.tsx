"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import {
  AGENTE_RES_DESTACADOS_DEFS,
  AGENTE_RES_MAX_OPEN_HOUSE_SLOTS,
  type AgenteResOpenHouseSlot,
} from "../schema/agenteIndividualResidencialFormState";
import { COMERCIAL_DESTACADOS_DEFS, TERRENO_DESTACADOS_DEFS } from "../schema/agenteComercialTerrenoMeta";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTextareaClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { digitsOnly, formatUsPhoneDisplay, onPhoneInputChange } from "../application/utils/phoneMask";
import type { BrAgenteResidencialCopy } from "../application/brAgenteResidencialCopy";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import {
  labelDestacadoComercialForPublishStep,
  labelDestacadoForPublishStep,
  labelDestacadoTerrenoForPublishStep,
} from "../lib/agenteResidencialPreviewFormat";

export function Step04DetallesEsenciales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const c = t.previewFormat.condicion;
  const cat = state.categoriaPropiedad;

  const condicionSelect = (
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
  );

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step04.title}</h2>
      <p className={aiSubClass}>{t.step04.sub}</p>
      {cat === "residencial" ? (
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
          {condicionSelect}
        </div>
      ) : null}

      {cat === "comercial" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <div className="sm:col-span-2">
            <AiField label={t.step04.usoComercial} hint={t.step04.usoComercialHint}>
              <input
                className={aiInputClass}
                value={state.comercialUso}
                onChange={(e) => setState((s) => ({ ...s, comercialUso: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          <AiField label={t.step04.oficinasComercial} hint={t.step04.oficinasComercialHint}>
            <input
              className={aiInputClass}
              value={state.comercialOficinas}
              onChange={(e) => setState((s) => ({ ...s, comercialOficinas: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
          <AiField label={t.step04.banos}>
            <input className={aiInputClass} value={state.banos} onChange={(e) => setState((s) => ({ ...s, banos: e.target.value }))} autoComplete="off" />
          </AiField>
          <AiField label={t.step04.nivelesComercial} hint={t.step04.nivelesComercialHint}>
            <input
              className={aiInputClass}
              value={state.comercialNiveles}
              onChange={(e) => setState((s) => ({ ...s, comercialNiveles: e.target.value }))}
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
          <div className="sm:col-span-2">
            <AiField label={t.step04.zonificacionComercial} hint={t.step04.zonificacionComercialHint}>
              <input
                className={aiInputClass}
                value={state.comercialZonificacion}
                onChange={(e) => setState((s) => ({ ...s, comercialZonificacion: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          {condicionSelect}
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
                checked={state.comercialAccesoCarga}
                onChange={(e) => setState((s) => ({ ...s, comercialAccesoCarga: e.target.checked }))}
              />
              <span>
                <span className="font-semibold">{t.step04.accesoCarga}</span>
                <span className="mt-0.5 block text-xs text-[#5C5346]/90">{t.step04.accesoCargaHint}</span>
              </span>
            </label>
          </div>
        </div>
      ) : null}

      {cat === "terreno_lote" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AiField label={t.step04.tamanoLote} hint={t.step04.tamanoLoteHint}>
              <input
                className={aiInputClass}
                value={state.tamanoLoteSqft}
                onChange={(e) => setState((s) => ({ ...s, tamanoLoteSqft: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          <div className="sm:col-span-2">
            <AiField label={t.step04.usoZonificacionTerreno} hint={t.step04.usoZonificacionTerrenoHint}>
              <input
                className={aiInputClass}
                value={state.terrenoUsoZonificacion}
                onChange={(e) => setState((s) => ({ ...s, terrenoUsoZonificacion: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          <AiField label={t.step04.accesoTerreno} hint={t.step04.accesoTerrenoHint}>
            <input
              className={aiInputClass}
              value={state.terrenoAcceso}
              onChange={(e) => setState((s) => ({ ...s, terrenoAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
          <div className="sm:col-span-2">
            <AiField label={t.step04.serviciosTerreno} hint={t.step04.serviciosTerrenoHint}>
              <input
                className={aiInputClass}
                value={state.terrenoServicios}
                onChange={(e) => setState((s) => ({ ...s, terrenoServicios: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          <div className="sm:col-span-2">
            <AiField label={t.step04.topografiaTerreno} hint={t.step04.topografiaTerrenoHint}>
              <input
                className={aiInputClass}
                value={state.terrenoTopografia}
                onChange={(e) => setState((s) => ({ ...s, terrenoTopografia: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
                checked={state.terrenoListoConstruir}
                onChange={(e) => setState((s) => ({ ...s, terrenoListoConstruir: e.target.checked }))}
              />
              <span className="font-semibold">{t.step04.listoConstruirTerreno}</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
                checked={state.terrenoCercado}
                onChange={(e) => setState((s) => ({ ...s, terrenoCercado: e.target.checked }))}
              />
              <span className="font-semibold">{t.step04.cercadoTerreno}</span>
            </label>
          </div>
        </div>
      ) : null}
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
  const cat = state.categoriaPropiedad;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{t.step05.title}</h2>
      <p className={aiSubClass}>{t.step05.sub}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {cat === "residencial"
          ? AGENTE_RES_DESTACADOS_DEFS.map((def) => (
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
            ))
          : null}
        {cat === "comercial"
          ? COMERCIAL_DESTACADOS_DEFS.map((def) => (
              <label key={def.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
                  checked={Boolean(state.destacadosComercial[def.id])}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      destacadosComercial: { ...s.destacadosComercial, [def.id]: e.target.checked },
                    }))
                  }
                />
                {labelDestacadoComercialForPublishStep(def.id, loc)}
              </label>
            ))
          : null}
        {cat === "terreno_lote"
          ? TERRENO_DESTACADOS_DEFS.map((def) => (
              <label key={def.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
                  checked={Boolean(state.destacadosTerreno[def.id])}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      destacadosTerreno: { ...s.destacadosTerreno, [def.id]: e.target.checked },
                    }))
                  }
                />
                {labelDestacadoTerrenoForPublishStep(def.id, loc)}
              </label>
            ))
          : null}
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

  const agentePersonalDigits = digitsOnly(state.agenteTelefonoPersonal || state.telefonoPrincipal);
  const agenteOfficeDigits = digitsOnly(state.agenteTelefonoOficina);
  const showAgentePrimaryLlamadas = agentePersonalDigits.length >= 10 && agenteOfficeDigits.length >= 10;

  const marcaBlock = (
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
  );

  const mostrarMarcaToggle = (
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
  );

  const agenteBlock = (
    <>
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
        <AiField label={s7.telefonoPersonal}>
          <input
            className={aiInputClass}
            value={formatUsPhoneDisplay(digitsOnly(state.agenteTelefonoPersonal))}
            onChange={(e) => {
              const prev = digitsOnly(state.agenteTelefonoPersonal);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, agenteTelefonoPersonal: display, telefonoPrincipal: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </AiField>
        <AiField label={s7.telefonoOficina}>
          <input
            className={aiInputClass}
            value={formatUsPhoneDisplay(digitsOnly(state.agenteTelefonoOficina))}
            onChange={(e) => {
              const prev = digitsOnly(state.agenteTelefonoOficina);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, agenteTelefonoOficina: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </AiField>
        <AiField label={s7.whatsapp} hint={s7.whatsappHint}>
          <input
            className={aiInputClass}
            value={formatUsPhoneDisplay(digitsOnly(state.agenteWhatsapp))}
            onChange={(e) => {
              const prev = digitsOnly(state.agenteWhatsapp);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, agenteWhatsapp: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </AiField>
        {showAgentePrimaryLlamadas ? (
          <fieldset className="sm:col-span-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.numeroPrincipalLlamadas}</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#2C2416]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                  checked={state.agentePrincipalLlamadas === "personal"}
                  onChange={() => setState((s) => ({ ...s, agentePrincipalLlamadas: "personal" }))}
                />
                {s7.principalPersonal}
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                  checked={state.agentePrincipalLlamadas === "oficina"}
                  onChange={() => setState((s) => ({ ...s, agentePrincipalLlamadas: "oficina" }))}
                />
                {s7.principalOficina}
              </label>
            </div>
          </fieldset>
        ) : null}
        <AiField label={s7.correoAgente}>
          <input
            type="email"
            className={aiInputClass}
            value={state.correoPrincipal}
            onChange={(e) => setState((s) => ({ ...s, correoPrincipal: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
        <AiField label={s7.sitioWebAgente} hint={s7.sitioWebAgenteHint}>
          <input
            className={aiInputClass}
            type="url"
            value={state.agenteSitioWeb}
            onChange={(e) => setState((s) => ({ ...s, agenteSitioWeb: e.target.value }))}
            placeholder="https://"
            autoComplete="url"
          />
        </AiField>
        <div className="sm:col-span-2">
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.redes}</p>
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
            <AiField label={s7.enlaceSocialAdicional}>
              <input className={aiInputClass} type="url" value={state.socialOtro} onChange={(e) => setState((s) => ({ ...s, socialOtro: e.target.value }))} placeholder="https://" autoComplete="off" />
            </AiField>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s7.title}</h2>
      <p className={aiSubClass}>{s7.sub}</p>

      {agenteBlock}
      {mostrarMarcaToggle}
      {state.mostrarMarcaEnTarjeta ? <div className="mt-2">{marcaBlock}</div> : null}

      {!state.mostrarSegundoAgente ? (
        <button
          type="button"
          className="mt-6 w-full rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-left text-sm font-semibold text-[#2C2416] transition hover:border-[#C9B46A]/60 hover:bg-[#FFFCF7] sm:w-auto"
          onClick={() => setState((s) => ({ ...s, mostrarSegundoAgente: true }))}
        >
          {s7.agregarSegundoAgente}
        </button>
      ) : (
        <div className="mt-6 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.segundoAgente}</p>
            <button
              type="button"
              className="text-xs font-semibold text-[#8a5a2a] underline underline-offset-2"
              onClick={() => setState((s) => ({ ...s, mostrarSegundoAgente: false }))}
            >
              {s7.ocultarSegundoAgente}
            </button>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <PhotoOrFileRow
                label={s7.agente2Foto}
                hint={s7.agente2FotoHint}
                value={state.agente2FotoDataUrl}
                onChange={(v) => setState((s) => ({ ...s, agente2FotoDataUrl: v }))}
                subirImagen={s7.subirImagen}
                pegarUrlImagen={s7.pegarUrlImagen}
                quitar={quitar}
              />
            </div>
            <AiField label={s7.agente2Nombre}>
              <input
                className={aiInputClass}
                value={state.agente2Nombre}
                onChange={(e) => setState((s) => ({ ...s, agente2Nombre: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
            <AiField label={s7.agente2Titulo}>
              <input
                className={aiInputClass}
                value={state.agente2Titulo}
                onChange={(e) => setState((s) => ({ ...s, agente2Titulo: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
            <AiField label={s7.agente2Licencia}>
              <input
                className={aiInputClass}
                value={state.agente2Licencia}
                onChange={(e) => setState((s) => ({ ...s, agente2Licencia: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
            <AiField label={s7.telefonoPersonal}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.agente2TelefonoPersonal))}
                onChange={(e) => {
                  const prev = digitsOnly(state.agente2TelefonoPersonal);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, agente2TelefonoPersonal: display, agente2Telefono: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            <AiField label={s7.telefonoOficina}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.agente2TelefonoOficina))}
                onChange={(e) => {
                  const prev = digitsOnly(state.agente2TelefonoOficina);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, agente2TelefonoOficina: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            <AiField label={s7.whatsapp} hint={s7.whatsappHint}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.agente2Whatsapp))}
                onChange={(e) => {
                  const prev = digitsOnly(state.agente2Whatsapp);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, agente2Whatsapp: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            {digitsOnly(state.agente2TelefonoPersonal || state.agente2Telefono).length >= 10 &&
            digitsOnly(state.agente2TelefonoOficina).length >= 10 ? (
              <fieldset className="sm:col-span-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.numeroPrincipalLlamadas}</legend>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#2C2416]">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                      checked={state.agente2PrincipalLlamadas === "personal"}
                      onChange={() => setState((s) => ({ ...s, agente2PrincipalLlamadas: "personal" }))}
                    />
                    {s7.principalPersonal}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                      checked={state.agente2PrincipalLlamadas === "oficina"}
                      onChange={() => setState((s) => ({ ...s, agente2PrincipalLlamadas: "oficina" }))}
                    />
                    {s7.principalOficina}
                  </label>
                </div>
              </fieldset>
            ) : null}
            <AiField label={s7.agente2Correo}>
              <input
                type="email"
                className={aiInputClass}
                value={state.agente2Correo}
                onChange={(e) => setState((s) => ({ ...s, agente2Correo: e.target.value }))}
                autoComplete="email"
              />
            </AiField>
            <AiField label={s7.sitioWebAgente} hint={s7.sitioWebAgenteHint}>
              <input
                className={aiInputClass}
                type="url"
                value={state.agente2SitioWeb}
                onChange={(e) => setState((s) => ({ ...s, agente2SitioWeb: e.target.value }))}
                placeholder="https://"
                autoComplete="url"
              />
            </AiField>
            <div className="sm:col-span-2">
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.redes}</p>
              <p className="mt-1 text-sm text-[#5C5346]/85">{s7.redesSub}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <AiField label={s7.instagram}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialInstagram}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialInstagram: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={s7.facebook}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialFacebook}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialFacebook: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={s7.youtube}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialYoutube}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialYoutube: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={s7.tiktok}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialTiktok}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialTiktok: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={s7.x}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialX}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialX: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
                <AiField label={s7.enlaceSocialAdicional}>
                  <input
                    className={aiInputClass}
                    type="url"
                    value={state.agente2SocialOtro}
                    onChange={(e) => setState((s) => ({ ...s, agente2SocialOtro: e.target.value }))}
                    placeholder="https://"
                    autoComplete="off"
                  />
                </AiField>
              </div>
            </div>
          </div>
        </div>
      )}

      {!state.mostrarBrokerAsesor ? (
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-left text-sm font-semibold text-[#2C2416] transition hover:border-[#C9B46A]/60 hover:bg-[#FFFCF7] sm:w-auto"
          onClick={() => setState((s) => ({ ...s, mostrarBrokerAsesor: true }))}
        >
          {s7.agregarBrokerAsesor}
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7]/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.brokerSection}</p>
            <button
              type="button"
              className="text-xs font-semibold text-[#8a5a2a] underline underline-offset-2"
              onClick={() => setState((s) => ({ ...s, mostrarBrokerAsesor: false }))}
            >
              {s7.ocultarBrokerAsesor}
            </button>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <PhotoOrFileRow
                label={s7.brokerFoto}
                hint={s7.brokerFotoHint}
                value={state.brokerFotoDataUrl}
                onChange={(v) => setState((s) => ({ ...s, brokerFotoDataUrl: v }))}
                subirImagen={s7.subirImagen}
                pegarUrlImagen={s7.pegarUrlImagen}
                quitar={quitar}
              />
            </div>
            <AiField label={s7.brokerNombre}>
              <input
                className={aiInputClass}
                value={state.brokerNombre}
                onChange={(e) => setState((s) => ({ ...s, brokerNombre: e.target.value }))}
                autoComplete="organization"
              />
            </AiField>
            <AiField label={s7.brokerTitulo}>
              <input className={aiInputClass} value={state.brokerTitulo} onChange={(e) => setState((s) => ({ ...s, brokerTitulo: e.target.value }))} autoComplete="off" />
            </AiField>
            <AiField label={s7.brokerLicencia}>
              <input className={aiInputClass} value={state.brokerLicencia} onChange={(e) => setState((s) => ({ ...s, brokerLicencia: e.target.value }))} autoComplete="off" />
            </AiField>
            <AiField label={s7.telefonoPersonal}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.brokerTelefonoPersonal))}
                onChange={(e) => {
                  const prev = digitsOnly(state.brokerTelefonoPersonal);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, brokerTelefonoPersonal: display, brokerTelefono: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            <AiField label={s7.telefonoOficina}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.brokerTelefonoOficina))}
                onChange={(e) => {
                  const prev = digitsOnly(state.brokerTelefonoOficina);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, brokerTelefonoOficina: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            <AiField label={s7.whatsapp} hint={s7.whatsappHint}>
              <input
                className={aiInputClass}
                value={formatUsPhoneDisplay(digitsOnly(state.brokerWhatsapp))}
                onChange={(e) => {
                  const prev = digitsOnly(state.brokerWhatsapp);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, brokerWhatsapp: display }));
                }}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(555) 555-5555"
              />
            </AiField>
            {digitsOnly(state.brokerTelefonoPersonal || state.brokerTelefono).length >= 10 &&
            digitsOnly(state.brokerTelefonoOficina).length >= 10 ? (
              <fieldset className="sm:col-span-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3">
                <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">{s7.numeroPrincipalLlamadas}</legend>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#2C2416]">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                      checked={state.brokerPrincipalLlamadas === "personal"}
                      onChange={() => setState((s) => ({ ...s, brokerPrincipalLlamadas: "personal" }))}
                    />
                    {s7.principalPersonal}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      className="h-4 w-4 border-[#C9B46A] text-[#B8954A]"
                      checked={state.brokerPrincipalLlamadas === "oficina"}
                      onChange={() => setState((s) => ({ ...s, brokerPrincipalLlamadas: "oficina" }))}
                    />
                    {s7.principalOficina}
                  </label>
                </div>
              </fieldset>
            ) : null}
            <AiField label={s7.brokerEmail}>
              <input
                type="email"
                className={aiInputClass}
                value={state.brokerEmail}
                onChange={(e) => setState((s) => ({ ...s, brokerEmail: e.target.value }))}
                autoComplete="email"
              />
            </AiField>
            <AiField label={s7.brokerSitioWeb} hint={s7.brokerSitioWebHint}>
              <input
                className={aiInputClass}
                type="url"
                value={state.brokerSitioWeb}
                onChange={(e) => setState((s) => ({ ...s, brokerSitioWeb: e.target.value }))}
                placeholder="https://"
                autoComplete="url"
              />
            </AiField>
            <AiField label={s7.brokerInstagram}>
              <input className={aiInputClass} type="url" value={state.brokerInstagram} onChange={(e) => setState((s) => ({ ...s, brokerInstagram: e.target.value }))} placeholder="https://" />
            </AiField>
            <AiField label={s7.brokerFacebook}>
              <input className={aiInputClass} type="url" value={state.brokerFacebook} onChange={(e) => setState((s) => ({ ...s, brokerFacebook: e.target.value }))} placeholder="https://" />
            </AiField>
            <AiField label={s7.brokerYoutube}>
              <input className={aiInputClass} type="url" value={state.brokerYoutube} onChange={(e) => setState((s) => ({ ...s, brokerYoutube: e.target.value }))} placeholder="https://" />
            </AiField>
            <AiField label={s7.brokerTiktok}>
              <input className={aiInputClass} type="url" value={state.brokerTiktok} onChange={(e) => setState((s) => ({ ...s, brokerTiktok: e.target.value }))} placeholder="https://" />
            </AiField>
            <AiField label={s7.brokerX}>
              <input className={aiInputClass} type="url" value={state.brokerX} onChange={(e) => setState((s) => ({ ...s, brokerX: e.target.value }))} placeholder="https://" />
            </AiField>
            <AiField label={s7.brokerEnlaceAdicional}>
              <input className={aiInputClass} type="url" value={state.brokerOtro} onChange={(e) => setState((s) => ({ ...s, brokerOtro: e.target.value }))} placeholder="https://" />
            </AiField>
          </div>
        </div>
      )}

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
      <p className="mt-1 text-xs text-[#5C5346]/85">{s8.contactoBaseSub}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
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

const emptyOpenHouseSlot = (): AgenteResOpenHouseSlot => ({
  fecha: "",
  inicio: "",
  fin: "",
  notas: "",
});

export function Step09ExtrasOpcionales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const { t } = useBrAgenteResidencialCopy();
  const s9 = t.step09;
  const slots = state.openHouseSlots;
  const canAddMore = slots.length < AGENTE_RES_MAX_OPEN_HOUSE_SLOTS;

  const patchSlot = (index: number, patch: Partial<AgenteResOpenHouseSlot>) => {
    setState((s) => ({
      ...s,
      openHouseSlots: s.openHouseSlots.map((row, j) => (j === index ? { ...row, ...patch } : row)),
    }));
  };

  const removeSlot = (index: number) => {
    setState((s) => ({ ...s, openHouseSlots: s.openHouseSlots.filter((_, j) => j !== index) }));
  };

  const addSlot = () => {
    setState((s) => ({
      ...s,
      openHouseSlots: [...s.openHouseSlots, emptyOpenHouseSlot()].slice(0, AGENTE_RES_MAX_OPEN_HOUSE_SLOTS),
    }));
  };

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s9.title}</h2>
      <p className={aiSubClass}>{s9.sub}</p>
      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
          <p className="text-sm font-semibold">{s9.openHouse}</p>
          <div className="mt-3 space-y-4">
            {slots.map((slot, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF9] p-3"
              >
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#8B7355] underline-offset-2 hover:underline"
                    onClick={() => removeSlot(i)}
                  >
                    {s9.eliminarFecha}
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AiField label={s9.fecha}>
                    <input
                      type="date"
                      className={aiInputClass}
                      value={slot.fecha}
                      onChange={(e) => patchSlot(i, { fecha: e.target.value })}
                    />
                  </AiField>
                  <AiField label={s9.horaInicio}>
                    <input type="time" className={aiInputClass} value={slot.inicio} onChange={(e) => patchSlot(i, { inicio: e.target.value })} />
                  </AiField>
                  <AiField label={s9.horaFin}>
                    <input type="time" className={aiInputClass} value={slot.fin} onChange={(e) => patchSlot(i, { fin: e.target.value })} />
                  </AiField>
                  <div className="sm:col-span-2">
                    <AiField label={s9.notasOh}>
                      <input className={aiInputClass} value={slot.notas} onChange={(e) => patchSlot(i, { notas: e.target.value })} />
                    </AiField>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {canAddMore ? (
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-dashed border-[#C9B46A]/60 bg-[#FFFCF7] px-3 py-2.5 text-sm font-semibold text-[#5C4A28] transition hover:border-[#B8954A]/80 hover:bg-[#FFF6E7]"
              onClick={addSlot}
            >
              {s9.agregarOpenHouse}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
