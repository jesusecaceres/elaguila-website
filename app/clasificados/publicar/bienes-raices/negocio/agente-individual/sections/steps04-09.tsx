"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import { AiField, aiCardClass, aiInputClass, aiSubClass, aiTextareaClass, aiTitleClass } from "../application/formPrimitives";
import { readFileAsDataUrl } from "../application/utils/readFileAsDataUrl";
import { digitsOnly, formatUsPhoneDisplay, onPhoneInputChange } from "../application/utils/phoneMask";

export function Step04DetallesEsenciales({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const d = state.detalles;
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Detalles esenciales</h2>
      <p className={aiSubClass}>Sólo lo que ayuda al comprador a decidir; sin ficha técnica de oficina.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label="Recámaras">
          <input className={aiInputClass} value={d.recamaras} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, recamaras: e.target.value } }))} inputMode="numeric" autoComplete="off" />
        </AiField>
        <AiField label="Baños completos">
          <input className={aiInputClass} value={d.banos} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, banos: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Medios baños" hint="Opcional.">
          <input className={aiInputClass} value={d.mediosBanos} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, mediosBanos: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Tamaño interior" hint="Pies cuadrados aproximados.">
          <input className={aiInputClass} value={d.tamanoInterior} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, tamanoInterior: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Tamaño del lote" hint="Si aplica; si no, déjalo vacío.">
          <input className={aiInputClass} value={d.tamanoLote} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, tamanoLote: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Estacionamientos">
          <input className={aiInputClass} value={d.estacionamientos} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, estacionamientos: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Año de construcción">
          <input className={aiInputClass} value={d.anioConstruccion} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, anioConstruccion: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Condición de la propiedad" hint="Ej. remodelada, impecable, a actualizar.">
          <input className={aiInputClass} value={d.condicion} onChange={(e) => setState((s) => ({ ...s, detalles: { ...s.detalles, condicion: e.target.value } }))} autoComplete="off" />
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
          <label key={def.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
              checked={Boolean(state.destacados[def.key])}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  destacados: { ...s.destacados, [def.key]: e.target.checked },
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
        <AiField label="Notas adicionales (opcional)" hint="Detalle interno o mensaje corto; no es el cuerpo principal.">
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
  const ag = state.agente;

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Información profesional</h2>
      <p className={aiSubClass}>Tu tarjeta en el carril derecho de la vista previa.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AiField label="Nombre completo">
          <input className={aiInputClass} value={ag.nombre} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, nombre: e.target.value } }))} autoComplete="name" />
        </AiField>
        <AiField label="Título">
          <input className={aiInputClass} value={ag.titulo} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, titulo: e.target.value } }))} autoComplete="organization-title" />
        </AiField>
        <AiField label="Teléfono">
          <input
            className={aiInputClass}
            value={formatUsPhoneDisplay(digitsOnly(ag.telefono))}
            onChange={(e) => {
              const prev = digitsOnly(ag.telefono);
              const { display } = onPhoneInputChange(e.target.value, prev);
              setState((s) => ({ ...s, agente: { ...s.agente, telefono: display } }));
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
            value={ag.email}
            onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, email: e.target.value } }))}
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
                    void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, agente: { ...s.agente, fotoUrl: url } })));
                  }}
                />
              </label>
              <input
                className={`${aiInputClass} min-w-[200px] flex-1`}
                type="url"
                value={ag.fotoUrl.startsWith("data:") ? "" : ag.fotoUrl}
                onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, fotoUrl: e.target.value } }))}
                placeholder="Pegar URL de imagen"
                autoComplete="off"
              />
            </div>
            {ag.fotoUrl ? (
              <div className="mt-2 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ag.fotoUrl} alt="" className="h-24 w-24 rounded-lg border object-cover" />
                <button type="button" className="text-xs font-semibold text-red-800" onClick={() => setState((s) => ({ ...s, agente: { ...s.agente, fotoUrl: "" } }))}>
                  Quitar
                </button>
              </div>
            ) : null}
          </AiField>
        </div>
        <AiField label="Licencia o número profesional" hint="Si aplica en tu estado.">
          <input className={aiInputClass} value={ag.licencia} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, licencia: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Marca u oficina (opcional)">
          <input className={aiInputClass} value={ag.marcaOficina} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, marcaOficina: e.target.value } }))} autoComplete="organization" />
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Sitio web">
            <input className={aiInputClass} type="url" value={ag.sitioWeb} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, sitioWeb: e.target.value } }))} autoComplete="url" placeholder="https://" />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales (hasta 5)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ag.redes.map((r, i) => (
              <input
                key={i}
                className={aiInputClass}
                value={r}
                onChange={(e) => {
                  const next = [...ag.redes];
                  next[i] = e.target.value;
                  setState((s) => ({ ...s, agente: { ...s.agente, redes: next } }));
                }}
                placeholder={i === 0 ? "https://instagram.com/…" : `Enlace ${i + 1}`}
                autoComplete="off"
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Bio corta (opcional)">
            <textarea className={aiTextareaClass} value={ag.bio} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, bio: e.target.value } }))} autoComplete="off" />
          </AiField>
        </div>
        <AiField label="Área de servicio (opcional)">
          <input className={aiInputClass} value={ag.areaServicio} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, areaServicio: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Idiomas (opcional)">
          <input className={aiInputClass} value={ag.idiomas} onChange={(e) => setState((s) => ({ ...s, agente: { ...s.agente, idiomas: e.target.value } }))} placeholder="Ej. inglés y español" autoComplete="off" />
        </AiField>
      </div>
    </section>
  );
}

export function Step08CtaEnlaces({
  state,
  setState,
}: {
  state: AgenteIndividualResidencialFormState;
  setState: Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>;
}) {
  const c = state.cta;
  const row = (key: keyof typeof c, label: string) => (
    <label key={String(key)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A]"
        checked={Boolean(c[key])}
        onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, [key]: e.target.checked } }))}
      />
      {label}
    </label>
  );
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Contacto y enlaces externos</h2>
      <p className={aiSubClass}>Sólo se muestran en la vista previa si están activos y tienen destino (teléfono, correo o enlace).</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {row("permitirLlamar", "Llamar")}
        {row("permitirWhatsapp", "WhatsApp")}
        {row("permitirEnviarMensaje", "Enviar mensaje (correo)")}
        {row("permitirProgramarVisita", "Programar visita")}
        {row("mostrarVerSitioWeb", "Ver sitio web")}
        {row("mostrarVerRedes", "Ver redes")}
        {row("mostrarVerListadoCompleto", "Ver listado completo / MLS")}
        {row("mostrarVerTour", "Ver recorrido / tour")}
        {row("mostrarVerFolleto", "Ver folleto / PDF")}
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
  const x = state.extras;
  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>Extras opcionales</h2>
      <p className={aiSubClass}>Todo lo de abajo es opcional y sólo aparece en la vista previa si hay datos.</p>
      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A]"
              checked={x.openHouseActivo}
              onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, openHouseActivo: e.target.checked } }))}
            />
            Open house o puertas abiertas
          </label>
          {x.openHouseActivo ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label="Fecha">
                <input type="date" className={aiInputClass} value={x.openHouseFecha} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, openHouseFecha: e.target.value } }))} />
              </AiField>
              <AiField label="Hora inicio">
                <input type="time" className={aiInputClass} value={x.openHouseInicio} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, openHouseInicio: e.target.value } }))} />
              </AiField>
              <AiField label="Hora fin">
                <input type="time" className={aiInputClass} value={x.openHouseFin} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, openHouseFin: e.target.value } }))} />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label="Notas">
                  <input className={aiInputClass} value={x.openHouseNotas} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, openHouseNotas: e.target.value } }))} />
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
              checked={x.asesorFinancieroActivo}
              onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, asesorFinancieroActivo: e.target.checked } }))}
            />
            Incluir contacto de asesor financiero
          </label>
          {x.asesorFinancieroActivo ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AiField label="Nombre">
                <input className={aiInputClass} value={x.asesorNombre} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, asesorNombre: e.target.value } }))} autoComplete="name" />
              </AiField>
              <AiField label="Teléfono">
                <input className={aiInputClass} value={x.asesorTelefono} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, asesorTelefono: e.target.value } }))} autoComplete="tel" />
              </AiField>
              <div className="sm:col-span-2">
                <AiField label="Correo del asesor">
                  <input type="email" className={aiInputClass} value={x.asesorEmail} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, asesorEmail: e.target.value } }))} autoComplete="email" />
                </AiField>
              </div>
            </div>
          ) : null}
        </div>
        <AiField label="Puntos cercanos (opcional)" hint="Ej. parques, tiendas, escuelas que quieras mencionar sin saturar.">
          <textarea className={aiTextareaClass} value={x.puntosCercanos} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, puntosCercanos: e.target.value } }))} autoComplete="off" />
        </AiField>
        <AiField label="Transporte (opcional)" hint="Ej. acceso a autopista, línea de autobús.">
          <input className={aiInputClass} value={x.transporte} onChange={(e) => setState((s) => ({ ...s, extras: { ...s.extras, transporte: e.target.value } }))} autoComplete="off" />
        </AiField>
      </div>
    </section>
  );
}
