"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { IdentidadAgenteIndividualSection } from "../agente-individual/IdentidadAgenteIndividualSection";
import { IdentidadEquipoSection } from "../equipo/IdentidadEquipoSection";
import { IdentidadOficinaSection } from "../oficina-brokerage/IdentidadOficinaSection";
import { IdentidadConstructorSection } from "../constructor-desarrollador/IdentidadConstructorSection";
import { brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

export function IdentidadNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const t = state.advertiserType;
  if (!t) {
    return (
      <section className={brCardClass}>
        <h2 className={brSectionTitleClass}>Identidad del negocio</h2>
        <p className={brSubTitleClass}>Primero elige tu tipo de anunciante en el paso 1 para desbloquear los campos correctos.</p>
      </section>
    );
  }
  if (t === "agente_individual") return <IdentidadAgenteIndividualSection state={state} setState={setState} />;
  if (t === "equipo_agentes") return <IdentidadEquipoSection state={state} setState={setState} />;
  if (t === "oficina_brokerage") return <IdentidadOficinaSection state={state} setState={setState} />;
  if (t === "constructor_desarrollador") return <IdentidadConstructorSection state={state} setState={setState} />;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Identidad del negocio</h2>
      <p className={brSubTitleClass}>Selecciona un tipo de anunciante válido en el paso 1.</p>
    </section>
  );
}
