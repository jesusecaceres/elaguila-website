"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTextareaClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { digitsOnly, formatUsPhoneDisplay, onPhoneInputChange } from "../application/utils/phoneMask";

const CONDICION_OPTS: ReadonlyArray<{ value: AgenteIndividualResidencialFormState["condicionPropiedad"]; label: string }> = [
  { value: "excelente", label: "Excelente" },
  { value: "buena", label: "Buena" },
  { value: "regular", label: "Regular" },
  { value: "necesita_reparacion", label: "Necesita reparación" },
];

export function Step04DetallesEsenciales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Detalles esenciales</h2>
      <p className={aiSubClass}>Sólo lo que ayuda al comprador a decidir.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label="Recámaras">
          <input
            className={aiInputClass}
            value={state.recamaras}
            onChange={(e) => setState((s) => ({ ...s, recamaras: e.target.value }))}
            inputMode="numeric"
            autoComplete="off"
          />
        </AiField>
        <AiField label="Baños completos">
          <input className={aiInputClass} value={state.banos} onChange={(e) => setState((s) => ({ ...s, banos: e.target.value }))} autoComplete="off" />
        </AiField>
        <AiField label="Medios baños" hint="Opcional.">
          <input
            className={aiInputClass}
            value={state.mediosBanos}
            onChange={(e) => setState((s) => ({ ...s, mediosBanos: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Tamaño interior" hint="Pies cuadrados aproximados.">
          <input
            className={aiInputClass}
            value={state.tamanoInteriorSqft}
            onChange={(e) => setState((s) => ({ ...s, tamanoInteriorSqft: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Tamaño del lote" hint="Si aplica; si no, déjalo vacío.">
          <input
            className={aiInputClass}
            value={state.tamanoLoteSqft}
            onChange={(e) => setState((s) => ({ ...s, tamanoLoteSqft: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Estacionamientos">
          <input
            className={aiInputClass}
            value={state.estacionamientos}
            onChange={(e) => setState((s) => ({ ...s, estacionamientos: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Año de construcción">
          <input
            className={aiInputClass}
            value={state.anoConstruccion}
            onChange={(e) => setState((s) => ({ ...s, anoConstruccion: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Condición de la propiedad" hint="Estado general al momento de publicar.">
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
            {CONDICION_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Características destacadas</h2>
      <p className={aiSubClass}>Marca lo que quieres mostrar en la vista previa.</p>
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
            {def.label}
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Descripción</h2>
      <div className="mt-5 space-y-4">
        <AiField label="Descripción principal">
          <textarea
            className={aiTextareaClass}
            value={state.descripcionPrincipal}
            onChange={(e) => setState((s) => ({ ...s, descripcionPrincipal: e.target.value }))}
            autoComplete="off"
          />
        </AiField>
        <AiField label="Notas adicionales (opcional)" hint="Mensaje corto o detalle interno; no es el cuerpo principal.">
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
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
          Subir imagen
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
          placeholder="Pegar URL de imagen"
          autoComplete="off"
        />
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-24 w-24 rounded-lg border object-cover" />
          <button type="button" className="text-xs font-semibold text-red-800" onClick={() => onChange("")}>
            Quitar
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
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <AiField label={label} hint={hint}>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold">
          Subir archivo
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
          placeholder="Pegar URL"
          autoComplete="off"
        />
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-16 w-16 rounded-lg border object-cover" />
          <button type="button" className="text-xs font-semibold text-red-800" onClick={() => onChange("")}>
            Quitar
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Información profesional</h2>
      <p className={aiSubClass}>Cada campo corresponde a un espacio fijo en la vista previa.</p>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Agente</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PhotoOrFileRow
            label="Foto del agente"
            hint="Sube una imagen o pega una URL pública."
            value={state.agenteFotoDataUrl}
            onChange={(v) => setState((s) => ({ ...s, agenteFotoDataUrl: v }))}
          />
        </div>
        <AiField label="Nombre completo">
          <input className={aiInputClass} value={state.agenteNombre} onChange={(e) => setState((s) => ({ ...s, agenteNombre: e.target.value }))} autoComplete="name" />
        </AiField>
        <AiField label="Título">
          <input
            className={aiInputClass}
            value={state.agenteTitulo}
            onChange={(e) => setState((s) => ({ ...s, agenteTitulo: e.target.value }))}
            autoComplete="organization-title"
          />
        </AiField>
        <AiField label="Licencia o número profesional" hint="Si aplica en tu estado.">
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
            <span className="font-semibold">Mostrar oficina o marca en la tarjeta</span>
            <span className="mt-0.5 block text-xs text-[#5C5346]/90">
              Si está desactivado, la vista previa no muestra el bloque de marca aunque haya datos guardados.
            </span>
          </span>
        </label>
      </div>

      {state.mostrarMarcaEnTarjeta ? (
        <>
          <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Oficina o marca</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <AiField label="Nombre de oficina o marca">
              <input className={aiInputClass} value={state.marcaNombre} onChange={(e) => setState((s) => ({ ...s, marcaNombre: e.target.value }))} autoComplete="organization" />
            </AiField>
            <div className="sm:col-span-2">
              <PhotoOrUrlBlock
                label="Logo de oficina o marca"
                hint="Imagen o URL; se muestra arriba de tu foto en la vista previa."
                value={state.marcaLogoDataUrl}
                onChange={(v) => setState((s) => ({ ...s, marcaLogoDataUrl: v }))}
              />
            </div>
            <AiField label="Licencia de broker u oficina (opcional)">
              <input className={aiInputClass} value={state.marcaLicencia} onChange={(e) => setState((s) => ({ ...s, marcaLicencia: e.target.value }))} autoComplete="off" />
            </AiField>
            <AiField label="Sitio web de oficina o marca (opcional)" hint="Enlace breve bajo el nombre de la marca en la tarjeta.">
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

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales</p>
      <p className="mt-1 text-sm text-[#5C5346]/85">Un enlace por red; cada icono en la vista previa usa solo su campo.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <AiField label="Instagram">
          <input className={aiInputClass} type="url" value={state.socialInstagram} onChange={(e) => setState((s) => ({ ...s, socialInstagram: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label="Facebook">
          <input className={aiInputClass} type="url" value={state.socialFacebook} onChange={(e) => setState((s) => ({ ...s, socialFacebook: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label="YouTube">
          <input className={aiInputClass} type="url" value={state.socialYoutube} onChange={(e) => setState((s) => ({ ...s, socialYoutube: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label="TikTok">
          <input className={aiInputClass} type="url" value={state.socialTiktok} onChange={(e) => setState((s) => ({ ...s, socialTiktok: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label="X / Twitter">
          <input className={aiInputClass} type="url" value={state.socialX} onChange={(e) => setState((s) => ({ ...s, socialX: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
        <AiField label="Otro enlace social (opcional)">
          <input className={aiInputClass} type="url" value={state.socialOtro} onChange={(e) => setState((s) => ({ ...s, socialOtro: e.target.value }))} placeholder="https://" autoComplete="off" />
        </AiField>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <AiField label="Área de servicio (opcional)">
          <input className={aiInputClass} value={state.agenteAreaServicio} onChange={(e) => setState((s) => ({ ...s, agenteAreaServicio: e.target.value }))} autoComplete="off" />
        </AiField>
        <AiField label="Idiomas (opcional)">
          <input className={aiInputClass} value={state.agenteIdiomas} onChange={(e) => setState((s) => ({ ...s, agenteIdiomas: e.target.value }))} placeholder="Ej. inglés y español" autoComplete="off" />
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
      <h2 className={aiTitleClass}>Contacto y enlaces</h2>
      <p className={aiSubClass}>
        Los interruptores activan el botón; el destino concreto viene del campo correspondiente. Sin destino válido, el botón no
        aparece en la vista previa.
      </p>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Contacto base (tarjeta)</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <AiField label="Teléfono principal" hint="Se muestra en la tarjeta y sirve de respaldo si un destino de llamada va vacío.">
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
        <AiField label="Correo electrónico principal" hint="Se muestra en la tarjeta y sirve de respaldo para «Solicitar información».">
          <input
            type="email"
            className={aiInputClass}
            value={state.correoPrincipal}
            onChange={(e) => setState((s) => ({ ...s, correoPrincipal: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Destinos de los botones</p>
      <p className="mt-1 text-xs text-[#5C5346]/85">
        Cada botón usa solo su campo. Donde no indiques un valor, el mapa aplica respaldos (teléfono/correo principal, listado de
        información básica o archivos de la galería); está documentado en el código del mapa.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AiField label="Número para llamadas" hint="Si vacío: teléfono principal.">
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
        <AiField label="Número para WhatsApp" hint="Si vacío: teléfono principal.">
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
        <AiField label="Correo para solicitar información" hint="Si vacío: correo principal.">
          <input
            type="email"
            className={aiInputClass}
            value={state.ctaCorreoSolicitarInfo}
            onChange={(e) => setState((s) => ({ ...s, ctaCorreoSolicitarInfo: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
        <AiField label="Enlace para programar visita" hint="Calendly u otro enlace https. Sin enlace, no hay botón.">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaEnlaceProgramarVisita}
            onChange={(e) => setState((s) => ({ ...s, ctaEnlaceProgramarVisita: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label="Enlace del sitio web" hint="Botón «Ver sitio web». Si vacío: sitio de oficina o marca (paso anterior).">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaEnlaceSitioWeb}
            onChange={(e) => setState((s) => ({ ...s, ctaEnlaceSitioWeb: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label="Enlace del MLS o listado completo" hint="Si vacío: listado de «Información básica».">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlListadoCompleto}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlListadoCompleto: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label="Enlace MLS (destino propio)" hint="Si vacío: mismo destino que «listado completo» o listado básico.">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlMls}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlMls: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label="Enlace del tour" hint="Si vacío: tour de «Fotos y medios».">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlTour}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlTour: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
        <AiField label="Enlace del folleto" hint="Si vacío: folleto de «Fotos y medios».">
          <input
            className={aiInputClass}
            type="url"
            value={state.ctaUrlFolleto}
            onChange={(e) => setState((s) => ({ ...s, ctaUrlFolleto: e.target.value }))}
            placeholder="https://"
          />
        </AiField>
      </div>

      <p className="mt-8 text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Interruptores</p>
      <p className="mt-1 text-xs text-[#5C5346]/85">«Mostrar iconos de redes» requiere al menos un enlace en el paso de redes.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {row("permitirSolicitarInformacion", "Solicitar información")}
        {row("permitirProgramarVisita", "Programar visita")}
        {row("permitirLlamar", "Llamar")}
        {row("permitirWhatsApp", "WhatsApp")}
        {row("permitirVerSitioWeb", "Ver sitio web")}
        {row("permitirVerRedes", "Mostrar iconos de redes")}
        {row("permitirVerListadoCompleto", "Ver listado completo")}
        {row("permitirVerMls", "Ver MLS")}
        {row("permitirVerTour", "Ver tour")}
        {row("permitirVerFolleto", "Ver folleto")}
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Extras opcionales</h2>
      <p className={aiSubClass}>Opcional; sólo aparece en la vista previa si hay datos.</p>
      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A]"
              checked={state.extraOpenHouse}
              onChange={(e) => setState((s) => ({ ...s, extraOpenHouse: e.target.checked }))}
            />
            Open house
          </label>
          {state.extraOpenHouse ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label="Fecha">
                <input type="date" className={aiInputClass} value={state.openHouseFecha} onChange={(e) => setState((s) => ({ ...s, openHouseFecha: e.target.value }))} />
              </AiField>
              <AiField label="Hora inicio">
                <input type="time" className={aiInputClass} value={state.openHouseInicio} onChange={(e) => setState((s) => ({ ...s, openHouseInicio: e.target.value }))} />
              </AiField>
              <AiField label="Hora fin">
                <input type="time" className={aiInputClass} value={state.openHouseFin} onChange={(e) => setState((s) => ({ ...s, openHouseFin: e.target.value }))} />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label="Notas">
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
            Asesor financiero
          </label>
          {state.extraAsesorFinanciero ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label="Nombre">
                <input className={aiInputClass} value={state.asesorNombre} onChange={(e) => setState((s) => ({ ...s, asesorNombre: e.target.value }))} autoComplete="name" />
              </AiField>
              <AiField label="Teléfono">
                <input className={aiInputClass} value={state.asesorTelefono} onChange={(e) => setState((s) => ({ ...s, asesorTelefono: e.target.value }))} autoComplete="tel" />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label="Correo del asesor">
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
