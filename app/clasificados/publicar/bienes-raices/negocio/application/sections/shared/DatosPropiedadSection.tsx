"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrField, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

function SubtypeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <BrField label={label}>
      <select className={brInputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </BrField>
  );
}

export function DatosPropiedadSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const pub = state.publicationType;

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Datos principales de la propiedad</h2>
      <p className={brSubTitleClass}>
        Alimenta la franja de datos rápidos (recámaras, baños, pies², estacionamientos, año) en la vista previa.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Tipo de propiedad">
          <input
            className={brInputClass}
            value={state.tipoPropiedad}
            onChange={(e) => setState((s) => ({ ...s, tipoPropiedad: e.target.value }))}
            placeholder="Ej. Casa unifamiliar"
          />
        </BrField>

        {(pub === "residencial_venta" || pub === "residencial_renta") && (
          <SubtypeSelect
            label="Subtipo residencial"
            value={state.propertySubtype}
            onChange={(v) => setState((s) => ({ ...s, propertySubtype: v }))}
            options={["Casa", "Apartamento", "Condominio", "Townhouse", "Duplex / triplex", "Mobile home"]}
          />
        )}

        {pub === "comercial" && (
          <SubtypeSelect
            label="Subtipo comercial"
            value={state.propertySubtype}
            onChange={(v) => setState((s) => ({ ...s, propertySubtype: v }))}
            options={["Oficina", "Local", "Bodega", "Nave", "Edificio", "Terreno comercial"]}
          />
        )}

        {pub === "terreno" && (
          <SubtypeSelect
            label="Tipo de terreno"
            value={state.propertySubtype}
            onChange={(v) => setState((s) => ({ ...s, propertySubtype: v }))}
            options={["Residencial", "Comercial", "Agrícola", "Inversión"]}
          />
        )}

        <BrField label="Recámaras">
          <input
            className={brInputClass}
            value={state.recamaras}
            onChange={(e) => setState((s) => ({ ...s, recamaras: e.target.value }))}
          />
        </BrField>
        <BrField label="Baños completos">
          <input
            className={brInputClass}
            value={state.banosCompletos}
            onChange={(e) => setState((s) => ({ ...s, banosCompletos: e.target.value }))}
          />
        </BrField>
        <BrField label="Medios baños">
          <input
            className={brInputClass}
            value={state.mediosBanos}
            onChange={(e) => setState((s) => ({ ...s, mediosBanos: e.target.value }))}
          />
        </BrField>
        <BrField label="Pies cuadrados (construcción)">
          <input
            className={brInputClass}
            value={state.piesCuadrados}
            onChange={(e) => setState((s) => ({ ...s, piesCuadrados: e.target.value }))}
          />
        </BrField>
        <BrField label="Tamaño del lote">
          <input
            className={brInputClass}
            value={state.tamanoLote}
            onChange={(e) => setState((s) => ({ ...s, tamanoLote: e.target.value }))}
          />
        </BrField>
        <BrField label="Estacionamientos">
          <input
            className={brInputClass}
            value={state.estacionamientos}
            onChange={(e) => setState((s) => ({ ...s, estacionamientos: e.target.value }))}
          />
        </BrField>
        <BrField label="Año de construcción">
          <input
            className={brInputClass}
            value={state.anioConstruccion}
            onChange={(e) => setState((s) => ({ ...s, anioConstruccion: e.target.value }))}
          />
        </BrField>
        <BrField label="Niveles / pisos">
          <input
            className={brInputClass}
            value={state.niveles}
            onChange={(e) => setState((s) => ({ ...s, niveles: e.target.value }))}
          />
        </BrField>
        <BrField label="Estado / condición">
          <input
            className={brInputClass}
            value={state.condicion}
            onChange={(e) => setState((s) => ({ ...s, condicion: e.target.value }))}
            placeholder="Ej. Excelente, remodelada"
          />
        </BrField>
        {(pub === "residencial_renta" || pub === "comercial") && (
          <BrField label="¿Amueblado?">
            <select
              className={brInputClass}
              value={state.amueblado}
              onChange={(e) => setState((s) => ({ ...s, amueblado: e.target.value }))}
            >
              <option value="">—</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
              <option value="parcial">Parcial</option>
            </select>
          </BrField>
        )}
        <BrField label="¿HOA?">
          <select
            className={brInputClass}
            value={state.hoaSiNo}
            onChange={(e) => setState((s) => ({ ...s, hoaSiNo: e.target.value }))}
          >
            <option value="">—</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </BrField>
        {state.hoaSiNo === "si" ? (
          <BrField label="Cuota HOA (opcional)">
            <input
              className={brInputClass}
              value={state.cuotaHoa}
              onChange={(e) => setState((s) => ({ ...s, cuotaHoa: e.target.value }))}
            />
          </BrField>
        ) : null}
      </div>

      {pub === "proyecto_nuevo" ? (
        <div className="mt-8 border-t border-[#E8DFD0]/80 pt-6">
          <h3 className="text-sm font-bold text-[#1E1810]">Proyecto nuevo</h3>
          <p className={brSubTitleClass}>Estos datos refuerzan la tarjeta de desarrollo y la galería.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BrField label="Comunidad / desarrollo">
              <input
                className={brInputClass}
                value={state.proyectoComunidad}
                onChange={(e) => setState((s) => ({ ...s, proyectoComunidad: e.target.value }))}
              />
            </BrField>
            <BrField label="Modelo">
              <input
                className={brInputClass}
                value={state.proyectoModelo}
                onChange={(e) => setState((s) => ({ ...s, proyectoModelo: e.target.value }))}
              />
            </BrField>
            <BrField label="Etapa del proyecto">
              <input
                className={brInputClass}
                value={state.proyectoEtapa}
                onChange={(e) => setState((s) => ({ ...s, proyectoEtapa: e.target.value }))}
              />
            </BrField>
            <BrField label="Fecha estimada de entrega">
              <input
                className={brInputClass}
                value={state.proyectoEntregaEstimada}
                onChange={(e) => setState((s) => ({ ...s, proyectoEntregaEstimada: e.target.value }))}
              />
            </BrField>
            <BrField label="Unidades disponibles">
              <input
                className={brInputClass}
                value={state.proyectoUnidadesDisponibles}
                onChange={(e) => setState((s) => ({ ...s, proyectoUnidadesDisponibles: e.target.value }))}
              />
            </BrField>
            <div className="sm:col-span-2">
              <BrField label="Amenidades del desarrollo">
                <input
                  className={brInputClass}
                  value={state.proyectoAmenidades}
                  onChange={(e) => setState((s) => ({ ...s, proyectoAmenidades: e.target.value }))}
                />
              </BrField>
            </div>
          </div>
        </div>
      ) : null}

      {pub === "multifamiliar_inversion" ? (
        <div className="mt-8 border-t border-[#E8DFD0]/80 pt-6">
          <h3 className="text-sm font-bold text-[#1E1810]">Multifamiliar / inversión</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BrField label="Número de unidades">
              <input
                className={brInputClass}
                value={state.invNumUnidades}
                onChange={(e) => setState((s) => ({ ...s, invNumUnidades: e.target.value }))}
              />
            </BrField>
            <BrField label="Renta actual">
              <input
                className={brInputClass}
                value={state.invRentaActual}
                onChange={(e) => setState((s) => ({ ...s, invRentaActual: e.target.value }))}
              />
            </BrField>
            <BrField label="Ocupación">
              <input
                className={brInputClass}
                value={state.invOcupacion}
                onChange={(e) => setState((s) => ({ ...s, invOcupacion: e.target.value }))}
              />
            </BrField>
            <BrField label="Cap rate (opcional)">
              <input
                className={brInputClass}
                value={state.invCapRate}
                onChange={(e) => setState((s) => ({ ...s, invCapRate: e.target.value }))}
              />
            </BrField>
            <BrField label="Ingreso estimado (opcional)">
              <input
                className={brInputClass}
                value={state.invIngresoEstimado}
                onChange={(e) => setState((s) => ({ ...s, invIngresoEstimado: e.target.value }))}
              />
            </BrField>
          </div>
        </div>
      ) : null}
    </section>
  );
}
