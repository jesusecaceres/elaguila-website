"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  aiCardClass,
  aiHintClass,
  aiInputClass,
  aiLabelClass,
  aiSubClass,
  aiTextareaClass,
  aiTitleClass,
  AiField,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import type { RentasShowingFormSlice } from "@/app/clasificados/rentas/lib/leonixRentasShowing";

type Props<T extends RentasShowingFormSlice> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
  textareaFieldClass: string;
};

export function RentasShowingTourSection<T extends RentasShowingFormSlice>({
  state,
  setState,
  fieldClass,
  textareaFieldClass,
}: Props<T>) {
  const lang = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "es" : "es";
  return (
    <section className={`${aiCardClass} min-w-0`}>
      <h2 className={aiTitleClass}>{lang === "en" ? "Showings and tours" : "Visitas y recorridos"}</h2>
      <p className={aiSubClass}>
        {lang === "en"
          ? "Optional. If you fill any field, it will appear in preview and published listing."
          : "Opcional. Si completas algún campo, aparecerá en la vista previa y en el anuncio publicado."}
      </p>
      <div className="mt-5 grid min-w-0 gap-4 sm:gap-5">
        <AiField
          label={lang === "en" ? "Showings by appointment" : "Visitas con cita"}
          hint={lang === "en" ? "Indicate if visits are by appointment only." : "Indica si las visitas son solo con cita previa."}
        >
          <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#2C2416]">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(state.showingByAppointment)}
              onChange={(e) => setState((s) => ({ ...s, showingByAppointment: e.target.checked }))}
            />
            <span className="min-w-0">{lang === "en" ? "Visits are by appointment only" : "Las visitas son con cita previa"}</span>
          </label>
        </AiField>
        <AiField
          label={lang === "en" ? "Showing availability" : "Disponibilidad para visitas"}
          hint={lang === "en" ? "Hours or days you can show the space (optional)." : "Horarios o días en que puedes mostrar el espacio (opcional)."}
        >
          <input
            className={fieldClass}
            value={state.showingAvailability}
            onChange={(e) => setState((s) => ({ ...s, showingAvailability: e.target.value }))}
            placeholder={lang === "en" ? "E.g. Mon–Fri 10:00–18:00, Saturdays by appointment" : "Ej. Lun–vie 10:00–18:00, sábados con cita"}
          />
        </AiField>
        <AiField
          label={lang === "en" ? "Showing instructions" : "Instrucciones para visitas"}
          hint={lang === "en" ? "How to coordinate the visit, access, parking, etc. (optional)." : "Cómo coordinar la visita, acceso, estacionamiento, etc. (opcional)."}
        >
          <textarea
            className={textareaFieldClass}
            rows={3}
            value={state.showingInstructions}
            onChange={(e) => setState((s) => ({ ...s, showingInstructions: e.target.value }))}
            placeholder={lang === "en" ? "E.g. Send message with 24h notice; ring bell 2." : "Ej. Enviar mensaje con 24 h de anticipación; tocar timbre 2."}
          />
        </AiField>
        <AiField
          label={lang === "en" ? "Virtual tour (HTTPS link)" : "Tour virtual (enlace HTTPS)"}
          hint={lang === "en" ? "Only secure https links (Matterport, YouTube, etc.). Optional." : "Solo enlaces https seguros (Matterport, YouTube, etc.). Opcional."}
        >
          <input
            className={fieldClass}
            type="url"
            inputMode="url"
            value={state.virtualTourUrl}
            onChange={(e) => setState((s) => ({ ...s, virtualTourUrl: e.target.value }))}
            placeholder="https://…"
          />
          <p className={aiHintClass}>{lang === "en" ? "If the link is not valid, it will not be shown in the listing." : "Si el enlace no es válido, no se mostrará en el anuncio."}</p>
        </AiField>
      </div>
    </section>
  );
}
