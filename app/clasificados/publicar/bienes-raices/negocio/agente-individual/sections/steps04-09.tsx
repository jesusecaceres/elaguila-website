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
      <p className={aiSubClass}>Tu tarjeta en el carril derecho de la vista previa.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
        <AiField label="Teléfono">
          <input
            className={aiInputClass}
            value={formatUsPhoneDisplay(digitsOnly(state.agenteTelefono))}
            onChange={(e) => {
              const prev = digitsOnly(state.agenteTelefono);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, agenteTelefono: display }));
            }}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </AiField>
        <AiField label="Correo electrónico">
          <input
            type="email"
            className={aiInputClass}
            value={state.agenteEmail}
            onChange={(e) => setState((s) => ({ ...s, agenteEmail: e.target.value }))}
            autoComplete="email"
          />
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Foto" hint="Sube una imagen o pega un enlace público.">
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
                    void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, agenteFotoDataUrl: url })));
                  }}
                />
              </label>
              <input
                className={`${aiInputClass} min-w-[200px] flex-1`}
                type="url"
                value={state.agenteFotoDataUrl.startsWith("data:") ? "" : state.agenteFotoDataUrl}
                onChange={(e) => setState((s) => ({ ...s, agenteFotoDataUrl: e.target.value }))}
                placeholder="Pegar URL de imagen"
                autoComplete="off"
              />
            </div>
            {state.agenteFotoDataUrl ? (
              <div className="mt-2 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.agenteFotoDataUrl} alt="" className="h-24 w-24 rounded-lg border object-cover" />
                <button type="button" className="text-xs font-semibold text-red-800" onClick={() => setState((s) => ({ ...s, agenteFotoDataUrl: "" }))}>
                  Quitar
                </button>
              </div>
            ) : null}
          </AiField>
        </div>
        <AiField label="Licencia o número profesional" hint="Si aplica en tu estado.">
          <input className={aiInputClass} value={state.agenteLicencia} onChange={(e) => setState((s) => ({ ...s, agenteLicencia: e.target.value }))} autoComplete="off" />
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Sitio web">
            <input
              className={aiInputClass}
              type="url"
              value={state.agenteSitioWeb}
              onChange={(e) => setState((s) => ({ ...s, agenteSitioWeb: e.target.value }))}
              autoComplete="url"
              placeholder="https://"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Redes sociales" hint="Un enlace por línea (hasta cinco en la vista previa).">
            <textarea className={aiTextareaClass} value={state.agenteRedes} onChange={(e) => setState((s) => ({ ...s, agenteRedes: e.target.value }))} autoComplete="off" rows={4} />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Bio corta (opcional)">
            <textarea className={aiTextareaClass} value={state.agenteBioCorta} onChange={(e) => setState((s) => ({ ...s, agenteBioCorta: e.target.value }))} autoComplete="off" />
          </AiField>
        </div>
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
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Contacto y enlaces</h2>
      <p className={aiSubClass}>Sólo se muestran en la vista previa si están activos y tienen destino (teléfono, correo o enlace).</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {row("permitirSolicitarInformacion", "Solicitar información")}
        {row("permitirProgramarVisita", "Programar visita")}
        {row("permitirLlamar", "Llamar")}
        {row("permitirWhatsApp", "WhatsApp")}
        {row("permitirVerSitioWeb", "Ver sitio web")}
        {row("permitirVerRedes", "Ver redes")}
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
        <AiField label="Puntos cercanos (opcional)" hint="Ej. parques o servicios que quieras mencionar sin saturar.">
          <textarea className={aiTextareaClass} value={state.puntosCercanos} onChange={(e) => setState((s) => ({ ...s, puntosCercanos: e.target.value }))} autoComplete="off" />
        </AiField>
        <AiField label="Transporte (opcional)" hint="Ej. acceso a autopista o línea de autobús.">
          <input className={aiInputClass} value={state.transporte} onChange={(e) => setState((s) => ({ ...s, transporte: e.target.value }))} autoComplete="off" />
        </AiField>
      </div>
    </section>
  );
}
