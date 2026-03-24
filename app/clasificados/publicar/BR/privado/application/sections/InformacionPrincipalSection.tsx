import type { LeonixBRPrivadoPrincipal } from "../schema/leonixBrPrivadoForm";
import { LeonixCheckboxRow, LeonixSelect, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function InformacionPrincipalSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoPrincipal;
  onChange: (next: LeonixBRPrivadoPrincipal) => void;
}) {
  return (
    <SectionShell
      title="Información principal del inmueble"
      description="Cuéntanos lo más importante del inmueble. Mantén el título claro y el precio honesto."
    >
      <LeonixTextField
        label="Título del anuncio"
        helper="Ej.: Casa en esquina con cochera para dos autos."
        value={value.titulo}
        onChange={(e) => onChange({ ...value, titulo: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixSelect
          label="Operación"
          value={value.tipoOperacion}
          onChange={(e) => onChange({ ...value, tipoOperacion: e.target.value })}
        >
          <option value="">Selecciona…</option>
          <option value="venta">Venta</option>
          <option value="renta">Renta</option>
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
          <option value="otro">Otro</option>
        </LeonixSelect>
      </div>
      <LeonixTextField
        label="Subtipo"
        optional
        value={value.subtipo}
        onChange={(e) => onChange({ ...value, subtipo: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <LeonixTextField
          label="Precio"
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
            label="Mostrar precio"
            helper="Si lo apagas, no mostramos el precio en la ficha."
            checked={value.mostrarPrecio}
            onChange={(v) => onChange({ ...value, mostrarPrecio: v })}
          />
        </div>
      </div>
      <LeonixSelect
        label="Estatus del inmueble"
        value={value.estatusInmueble}
        onChange={(e) => onChange({ ...value, estatusInmueble: e.target.value })}
      >
        <option value="">Selecciona…</option>
        <option value="disponible">Disponible</option>
        <option value="negociacion">En negociación</option>
        <option value="reservado">Reservado</option>
      </LeonixSelect>
    </SectionShell>
  );
}
