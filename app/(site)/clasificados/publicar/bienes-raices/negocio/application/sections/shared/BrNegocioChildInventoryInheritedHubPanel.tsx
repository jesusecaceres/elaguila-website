"use client";

import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import { aiCardClass, aiSubClass, aiTitleClass } from "../../../agente-individual/application/formPrimitives";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";

/** Read-only inherited parent hub (step 7) for child inventory editor. */
export function BrNegocioChildInventoryInheritedHubPanel({
  state,
}: {
  state: AgenteIndividualResidencialFormState;
}) {
  const { t, lang } = useBrAgenteResidencialCopy();
  const s7 = t.step07;
  const inheritedNote =
    lang === "es"
      ? "La información profesional, contacto, redes, reseñas, financiamiento y destinos de contacto se tomará de la solicitud principal."
      : "Professional, contact, social, review, financing, and contact destination information will be inherited from the main application.";

  const rows = [
    { label: s7.nombre, value: state.agenteNombre },
    { label: s7.titulo, value: state.agenteTitulo },
    { label: s7.nombreMarca, value: state.marcaNombre },
    { label: s7.correoAgente, value: state.correoPrincipal },
    {
      label: s7.telefonoPersonal,
      value: state.agenteTelefonoPersonal || state.telefonoPrincipal,
    },
    { label: s7.telefonoOficina, value: state.agenteTelefonoOficina },
  ].filter((r) => r.value.trim());

  return (
    <section className={aiCardClass}>
      <h2 className={aiTitleClass}>{s7.title}</h2>
      <p className={aiSubClass}>{inheritedNote}</p>
      {rows.length ? (
        <dl className="mt-5 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2.5">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{row.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-[#1E1810]">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-[#5C5346]/85">
          {lang === "es" ? "Completa el paso 7 en el formulario principal." : "Complete step 7 on the main form."}
        </p>
      )}
    </section>
  );
}
