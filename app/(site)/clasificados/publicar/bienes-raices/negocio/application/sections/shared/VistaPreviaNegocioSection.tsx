"use client";

import { BR_PREVIEW_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

/** Controles de preview viven en la barra superior (`ClasificadosApplicationTopActions`). */
export function VistaPreviaNegocioSection() {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Vista previa</h2>
      <p className={brSubTitleClass}>
        Usa <strong className="text-[#1E1810]">Vista previa</strong> (valida campos mínimos) o{" "}
        <strong className="text-[#1E1810]">Abrir vista previa</strong> (borrador actual sin validación) en la parte superior del
        flujo. El mismo diseño aprobado se abre en{" "}
        <span className="font-mono text-[#6E5418]">{BR_PREVIEW_NEGOCIO}</span>; desde ahí{" "}
        <strong className="text-[#1E1810]">Volver a editar</strong> te regresa sin perder el borrador de la sesión.
      </p>
    </section>
  );
}
