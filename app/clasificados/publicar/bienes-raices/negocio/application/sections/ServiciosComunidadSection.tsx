"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function ServiciosComunidadSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Servicios, comunidad y datos fiscales"
      description="Servicios del inmueble, comunidad y referencias útiles para el comprador."
    >
      <div>
        <label className={brLabelClass}>Utilidades / servicios</label>
        <p className={brHintClass}>Agua, luz, drenaje, gas, internet…</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={inmueble.utilidadesServicios} onChange={(e) => p("utilidadesServicios", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Energía solar / green</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.energiaSolar} onChange={(e) => p("energiaSolar", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>HOA / comunidad</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.hoaComunidad} onChange={(e) => p("hoaComunidad", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Cuota HOA (si aplica)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.cuotaHoa} onChange={(e) => p("cuotaHoa", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Seguridad</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.seguridad} onChange={(e) => p("seguridad", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Acceso controlado</label>
        <input className={`${brInputClass} mt-2`} value={inmueble.accesoControlado} onChange={(e) => p("accesoControlado", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Detalles financieros</label>
        <p className={brHintClass}>Solo lo que quieras mostrar al público en esta etapa.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.detallesFinancieros} onChange={(e) => p("detallesFinancieros", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Detalles de listing / folio</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.detallesListing} onChange={(e) => p("detallesListing", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Impuesto / predial / parcela</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.taxParcel} onChange={(e) => p("taxParcel", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Escuelas y área</label>
        <textarea className={`${brInputClass} mt-2 min-h-[56px]`} value={inmueble.escuelasCercanas} onChange={(e) => p("escuelasCercanas", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
