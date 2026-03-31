"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function UbicacionSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  return (
    <BrSectionShell
      title="Ubicación"
      description="Agrega la dirección del inmueble. Si no quieres mostrarla completa al público, después la puedes ocultar."
    >
      <div>
        <label className={brLabelClass}>Dirección completa</label>
        <textarea
          className={`${brInputClass} mt-2 min-h-[72px]`}
          value={inmueble.direccionCompleta}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, direccionCompleta: e.target.value } }))
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Ciudad</label>
          <input
            className={`${brInputClass} mt-2`}
            value={inmueble.ciudad}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, ciudad: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>Estado</label>
          <input
            className={`${brInputClass} mt-2`}
            value={inmueble.estado}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, estado: e.target.value } }))
            }
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Código postal</label>
          <input
            className={`${brInputClass} mt-2`}
            value={inmueble.codigoPostal}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, codigoPostal: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>Colonia, zona o fraccionamiento</label>
          <p className={brHintClass}>Escribe la colonia, zona o fraccionamiento para ubicar mejor la propiedad.</p>
          <input
            className={`${brInputClass} mt-2`}
            value={inmueble.coloniaZona}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, coloniaZona: e.target.value } }))
            }
          />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Referencia de ubicación</label>
        <input
          className={`${brInputClass} mt-2`}
          placeholder="Cerca de…, entre calles…"
          value={inmueble.referenciaUbicacion}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, referenciaUbicacion: e.target.value } }))
          }
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          checked={inmueble.ocultarDireccionExacta}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              inmueble: { ...s.inmueble, ocultarDireccionExacta: e.target.checked },
            }))
          }
        />
        Ocultar dirección exacta al público (solo área aproximada)
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Punto aproximado en mapa</label>
          <p className={brHintClass}>Pega coordenadas o enlace si ya lo tienes. Si no, lo puedes dejar vacío.</p>
          <input
            className={`${brInputClass} mt-2`}
            value={inmueble.puntoMapaAprox}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, puntoMapaAprox: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>Área aproximada</label>
          <input
            className={`${brInputClass} mt-2`}
            placeholder="Ej. 2 km al norte del centro"
            value={inmueble.areaAproximada}
            onChange={(e) =>
              setState((s) => ({ ...s, inmueble: { ...s.inmueble, areaAproximada: e.target.value } }))
            }
          />
        </div>
      </div>
    </BrSectionShell>
  );
}
