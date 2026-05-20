"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrGate12dHoaCommunitySection } from "@/app/clasificados/publicar/bienes-raices/shared/BrGate12dHoaCommunitySection";
import {
  BrField,
  BrPreviewHint,
  brInputClass,
  brCardClass,
  brSectionTitleClass,
  brSubTitleClass,
  brTextareaClass,
} from "./brFormPrimitives";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function primaryPhone(s: BienesRaicesNegocioFormState): string {
  const adv = s.advertiserType;
  if (adv === "agente_individual") return trim(s.identityAgente.telDirecto) || trim(s.identityAgente.telOficina);
  if (adv === "equipo_agentes") return trim(s.identityEquipo.telGeneral);
  if (adv === "oficina_brokerage") return trim(s.identityOficina.telPrincipal);
  if (adv === "constructor_desarrollador") return trim(s.identityConstructor.tel);
  return "";
}

function primaryEmail(s: BienesRaicesNegocioFormState): string {
  const adv = s.advertiserType;
  if (adv === "agente_individual") return trim(s.identityAgente.email);
  if (adv === "equipo_agentes") return trim(s.identityEquipo.email);
  if (adv === "oficina_brokerage") return trim(s.identityOficina.email);
  if (adv === "constructor_desarrollador") return trim(s.identityConstructor.email);
  return "";
}

function primaryWebsite(s: BienesRaicesNegocioFormState): string {
  const adv = s.advertiserType;
  if (adv === "agente_individual") return trim(s.identityAgente.sitioWeb);
  if (adv === "equipo_agentes") return trim(s.identityEquipo.sitioWeb);
  if (adv === "oficina_brokerage") return trim(s.identityOficina.sitioWeb);
  if (adv === "constructor_desarrollador") return trim(s.identityConstructor.sitioWeb);
  return "";
}

function hasSocial(s: BienesRaicesNegocioFormState): boolean {
  const adv = s.advertiserType;
  const redes =
    adv === "agente_individual"
      ? s.identityAgente.redes
      : adv === "equipo_agentes"
        ? s.identityEquipo.redes
        : adv === "oficina_brokerage"
          ? s.identityOficina.redes
          : adv === "constructor_desarrollador"
            ? s.identityConstructor.redes
            : [];
  return (redes ?? []).some((r) => trim(r));
}

function siNoChecked(v: "" | "si" | "no"): boolean {
  return v !== "no";
}

export function ContactoCtasNegocioSection({
  state,
  setState,
  lang = "es",
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
  lang?: "es" | "en";
}) {
  const c = state.cta;
  const ch = state.contactChannels;
  const phone = primaryPhone(state);
  const email = primaryEmail(state);
  const website = primaryWebsite(state);
  const extraUrl = trim(ch.masInformacionUrl);
  const social = hasSocial(state);

  const toggles: Array<{
    key: string;
    label: string;
    available: boolean;
    hint?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
  }> = [
    {
      key: "permitirSolicitarInfo",
      label: "Solicitar información",
      available: Boolean(email),
      hint: email ? undefined : "Agrega correo en Identidad del negocio (paso 9).",
      checked: c.permitirSolicitarInfo,
      onChange: (v) => setState((s) => ({ ...s, cta: { ...s.cta, permitirSolicitarInfo: v } })),
    },
    {
      key: "permitirProgramarVisita",
      label: "Programar visita",
      available: Boolean(email),
      hint: email ? undefined : "Agrega correo en Identidad del negocio (paso 9).",
      checked: c.permitirProgramarVisita,
      onChange: (v) => setState((s) => ({ ...s, cta: { ...s.cta, permitirProgramarVisita: v } })),
    },
    {
      key: "permitirLlamar",
      label: "Llamar",
      available: Boolean(phone),
      hint: phone ? undefined : "Agrega teléfono en Identidad del negocio (paso 9).",
      checked: c.permitirLlamar,
      onChange: (v) => setState((s) => ({ ...s, cta: { ...s.cta, permitirLlamar: v } })),
    },
    {
      key: "permitirWhatsapp",
      label: "WhatsApp",
      available: Boolean(phone),
      hint: phone ? undefined : "Agrega teléfono en Identidad del negocio (paso 9).",
      checked: c.permitirWhatsapp,
      onChange: (v) => setState((s) => ({ ...s, cta: { ...s.cta, permitirWhatsapp: v } })),
    },
    {
      key: "sms",
      label: "Enviar texto",
      available: Boolean(phone),
      hint: phone ? undefined : "Agrega teléfono en Identidad del negocio (paso 9).",
      checked: siNoChecked(ch.permitirSms),
      onChange: (v) =>
        setState((s) => ({
          ...s,
          contactChannels: { ...s.contactChannels, permitirSms: v ? "si" : "no" },
        })),
    },
    {
      key: "website",
      label: "Visitar sitio web",
      available: Boolean(website) && state.trust.mostrarSitioWeb,
      hint: website ? "Activa “Mostrar sitio web” en Confianza si aún no lo hiciste." : "Agrega sitio web en Identidad del negocio (paso 9).",
      checked: Boolean(website) && state.trust.mostrarSitioWeb,
      disabled: true,
      onChange: () => undefined,
    },
    {
      key: "social",
      label: "Ver redes sociales",
      available: social && state.trust.mostrarRedes,
      hint: social ? "Las URLs se capturan en Identidad del negocio (paso 9)." : "Agrega enlaces de redes en Identidad del negocio.",
      checked: social && state.trust.mostrarRedes,
      disabled: true,
      onChange: () => undefined,
    },
  ];

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Botones y enlaces del anuncio</h2>
      <p className={brSubTitleClass}>
        Ya usamos la información profesional que agregaste. Aquí solo eliges qué botones quieres mostrar en la tarjeta pública.
      </p>
      <BrPreviewHint>
        Teléfono, correo, sitio web y redes se capturan en <strong className="text-[#1E1810]">Identidad del negocio</strong>{" "}
        (paso 9). Este paso no vuelve a pedir esos datos.
      </BrPreviewHint>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {toggles.map((t) => (
          <label
            key={t.key}
            className={
              "flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-sm " +
              (t.available
                ? "cursor-pointer border-[#E8DFD0] bg-white font-medium text-[#2C2416]"
                : "cursor-not-allowed border-[#E8DFD0]/60 bg-[#FAF7F2]/80 text-[#5C5346]/70")
            }
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A] disabled:opacity-40"
                checked={t.available ? t.checked : false}
                disabled={!t.available || t.disabled}
                onChange={(e) => t.onChange(e.target.checked)}
              />
              {t.label}
            </span>
            {t.hint ? <span className="text-xs font-normal text-[#5C5346]/85">{t.hint}</span> : null}
          </label>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <BrField
          label="Enlace adicional para más información"
          hint="Úsalo si hay detalles que no aparecen en el anuncio, como reglas de comunidad, HOA, documentos, brochure, MLS u otra página externa."
        >
          <input
            className={brInputClass}
            type="url"
            value={ch.masInformacionUrl}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                contactChannels: { ...s.contactChannels, masInformacionUrl: e.target.value },
              }))
            }
            placeholder="https://…"
          />
        </BrField>
        {extraUrl ? (
          <p className="self-end text-xs text-[#5C5346] sm:col-span-2">
            En la vista previa se mostrará como <strong>Más información</strong>, no como URL cruda.
          </p>
        ) : null}
        <BrField label="Mensaje prellenado del formulario" hint="Texto sugerido cuando alguien escribe desde el anuncio.">
          <textarea
            className={brTextareaClass}
            value={c.mensajePrellenado}
            onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, mensajePrellenado: e.target.value } }))}
          />
        </BrField>
        <BrField label="Instrucciones de contacto" hint="Opcional. Ej. “Respondo en menos de 2 horas”.">
          <textarea
            className={brTextareaClass}
            value={c.instruccionesContacto}
            onChange={(e) =>
              setState((s) => ({ ...s, cta: { ...s.cta, instruccionesContacto: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Horario preferido de contacto" hint="Opcional.">
          <input
            className={brInputClass}
            value={c.horarioPreferido}
            onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, horarioPreferido: e.target.value } }))}
          />
        </BrField>
      </div>

      <BrGate12dHoaCommunitySection
        variant="negocio"
        lang={lang}
        gate12d={state.gate12d}
        onChange={(patch) =>
          setState((s) => ({
            ...s,
            gate12d: { ...s.gate12d, ...patch },
          }))
        }
      />

      <div className="mt-6 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1E1810]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={c.openHouseActivo}
            onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, openHouseActivo: e.target.checked } }))}
          />
          Open house / visita abierta
        </label>
        {c.openHouseActivo ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BrField label="Fecha">
              <input
                type="date"
                className={brInputClass}
                value={c.openHouseFecha}
                onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, openHouseFecha: e.target.value } }))}
              />
            </BrField>
            <BrField label="Hora inicio">
              <input
                type="time"
                className={brInputClass}
                value={c.openHouseInicio}
                onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, openHouseInicio: e.target.value } }))}
              />
            </BrField>
            <BrField label="Hora fin">
              <input
                type="time"
                className={brInputClass}
                value={c.openHouseFin}
                onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, openHouseFin: e.target.value } }))}
              />
            </BrField>
            <div className="sm:col-span-2">
              <BrField label="Notas">
                <input
                  className={brInputClass}
                  value={c.openHouseNotas}
                  onChange={(e) => setState((s) => ({ ...s, cta: { ...s.cta, openHouseNotas: e.target.value } }))}
                />
              </BrField>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
