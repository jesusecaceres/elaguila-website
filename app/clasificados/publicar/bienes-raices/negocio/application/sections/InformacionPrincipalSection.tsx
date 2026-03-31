"use client";

import {
  BIENES_RAICES_SUBCATEGORIES,
  BR_PROPERTY_TYPE_OPTIONS,
} from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function InformacionPrincipalSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  return (
    <BrSectionShell
      title="Información principal del inmueble"
      description="Cuéntanos lo más importante del inmueble. Así se verá más claro para los clientes."
    >
      <div>
        <label className={brLabelClass}>Título del anuncio</label>
        <p className={brHintClass}>
          Escribe un título claro y atractivo. Ejemplo: Casa amplia con patio y cochera en San José.
        </p>
        <input
          className={`${brInputClass} mt-2`}
          value={inmueble.titulo}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, titulo: e.target.value } }))
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Tipo de propiedad</label>
          <select
            className={`${brInputClass} mt-2`}
            value={inmueble.tipoPropiedad}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, tipoPropiedad: e.target.value } }))
            }
          >
            <option value="">Selecciona…</option>
            {BR_PROPERTY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label.es}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={brLabelClass}>Subtipo / categoría</label>
          <select
            className={`${brInputClass} mt-2`}
            value={inmueble.subtipo}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, subtipo: e.target.value } }))
            }
          >
            <option value="">Opcional</option>
            {BIENES_RAICES_SUBCATEGORIES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label.es}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={brLabelClass}>Precio</label>
          <p className={brHintClass}>Pon el precio real. Si todavía no quieres mostrarlo al público, puedes ocultarlo.</p>
          <input
            className={`${brInputClass} mt-2`}
            inputMode="decimal"
            value={inmueble.precio}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, precio: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>Moneda</label>
          <select
            className={`${brInputClass} mt-2`}
            value={inmueble.moneda}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, moneda: e.target.value } }))
            }
          >
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          checked={inmueble.mostrarPrecio}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              inmueble: { ...s.inmueble, mostrarPrecio: e.target.checked },
            }))
          }
        />
        Mostrar precio en la ficha pública
      </label>
      <div>
        <label className={brLabelClass}>Estatus del inmueble</label>
        <input
          className={`${brInputClass} mt-2`}
          placeholder="Ej. Disponible, en negociación, próximo a entrega…"
          value={inmueble.estatusInmueble}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, estatusInmueble: e.target.value } }))
          }
        />
      </div>
    </BrSectionShell>
  );
}
