import type { LeonixBRNegocioPrincipal } from "../schema/leonixBrNegocioForm";
import { LeonixCheckboxRow, LeonixSelect, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function InformacionPrincipalSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioPrincipal;
  onChange: (next: LeonixBRNegocioPrincipal) => void;
}) {
  return (
    <SectionShell
      title="Información principal del inmueble"
      description="Cuéntanos lo más importante del inmueble. Así se verá más claro para los clientes."
    >
      <LeonixTextField
        label="Título del anuncio"
        helper="Escribe un título claro y atractivo. Ejemplo: Casa amplia con patio y cochera en San José."
        value={value.titulo}
        onChange={(e) => onChange({ ...value, titulo: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixSelect
          label="Tipo de operación"
          helper="Selecciona la operación principal."
          value={value.tipoOperacion}
          onChange={(e) => onChange({ ...value, tipoOperacion: e.target.value })}
        >
          <option value="">Selecciona…</option>
          <option value="venta">Venta</option>
          <option value="renta">Renta</option>
          <option value="venta_renta">Venta o renta</option>
          <option value="preventa">Preventa</option>
        </LeonixSelect>
        <LeonixSelect
          label="Tipo de propiedad"
          value={value.tipoPropiedad}
          onChange={(e) => onChange({ ...value, tipoPropiedad: e.target.value })}
        >
          <option value="">Selecciona…</option>
          <option value="casa">Casa</option>
          <option value="departamento">Departamento</option>
          <option value="terreno">Terreno</option>
          <option value="local">Local</option>
          <option value="oficina">Oficina</option>
          <option value="otro">Otro</option>
        </LeonixSelect>
      </div>
      <LeonixTextField
        label="Subtipo"
        optional
        helper="Si aplica: loft, dúplex, penthouse, etc."
        value={value.subtipo}
        onChange={(e) => onChange({ ...value, subtipo: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <LeonixTextField
          label="Precio"
          helper="Pon el precio real. Si todavía no quieres mostrarlo al público, puedes ocultarlo abajo."
          value={value.precio}
          onChange={(e) => onChange({ ...value, precio: e.target.value })}
          inputMode="decimal"
        />
        <LeonixSelect
          label="Moneda"
          value={value.moneda}
          onChange={(e) => onChange({ ...value, moneda: e.target.value })}
        >
          <option value="MXN">MXN</option>
          <option value="USD">USD</option>
        </LeonixSelect>
        <div className="flex items-end">
          <LeonixCheckboxRow
            label="Mostrar precio al público"
            helper="Si lo apagas, el precio no se muestra en la ficha."
            checked={value.mostrarPrecio}
            onChange={(v) => onChange({ ...value, mostrarPrecio: v })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixSelect
          label="Estatus del inmueble"
          helper="Disponible, en negociación, etc."
          value={value.estatusInmueble}
          onChange={(e) => onChange({ ...value, estatusInmueble: e.target.value })}
        >
          <option value="">Selecciona…</option>
          <option value="disponible">Disponible</option>
          <option value="negociacion">En negociación</option>
          <option value="reservado">Reservado</option>
          <option value="vendido">Vendido</option>
        </LeonixSelect>
        <LeonixTextField
          label="Tipo de publicación interna"
          optional
          helper="Para tu operación o CRM, si lo necesitas."
          value={value.tipoPublicacionInterna}
          onChange={(e) => onChange({ ...value, tipoPublicacionInterna: e.target.value })}
        />
      </div>
    </SectionShell>
  );
}
