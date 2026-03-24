import type { LeonixBRPrivadoUbicacion } from "../schema/leonixBrPrivadoForm";
import { LeonixCheckboxRow, LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function UbicacionSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoUbicacion;
  onChange: (next: LeonixBRPrivadoUbicacion) => void;
}) {
  return (
    <SectionShell
      title="Ubicación"
      description="Agrega la dirección del inmueble. Si no quieres mostrarla completa al público, puedes ocultarla."
    >
      <LeonixTextarea
        label="Dirección"
        rows={2}
        value={value.direccionCompleta}
        onChange={(e) => onChange({ ...value, direccionCompleta: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Ciudad" value={value.ciudad} onChange={(e) => onChange({ ...value, ciudad: e.target.value })} />
        <LeonixTextField label="Estado" value={value.estado} onChange={(e) => onChange({ ...value, estado: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Código postal"
          value={value.codigoPostal}
          onChange={(e) => onChange({ ...value, codigoPostal: e.target.value })}
        />
        <LeonixTextField
          label="Colonia o zona"
          helper="Así ubicamos mejor la propiedad en mapa y búsqueda."
          value={value.coloniaZona}
          onChange={(e) => onChange({ ...value, coloniaZona: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Referencia"
        optional
        value={value.referenciaUbicacion}
        onChange={(e) => onChange({ ...value, referenciaUbicacion: e.target.value })}
      />
      <LeonixCheckboxRow
        label="Ocultar dirección exacta"
        checked={value.ocultarDireccionExacta}
        onChange={(v) => onChange({ ...value, ocultarDireccionExacta: v })}
      />
      <LeonixTextField
        label="Área aproximada (si ocultas dirección)"
        optional
        value={value.areaAproximada}
        onChange={(e) => onChange({ ...value, areaAproximada: e.target.value })}
      />
    </SectionShell>
  );
}
