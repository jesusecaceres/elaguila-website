import type { LeonixBRNegocioUbicacion } from "../schema/leonixBrNegocioForm";
import { LeonixCheckboxRow, LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function UbicacionSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioUbicacion;
  onChange: (next: LeonixBRNegocioUbicacion) => void;
}) {
  return (
    <SectionShell
      title="Ubicación"
      description="Agrega la dirección del inmueble. Si no quieres mostrarla completa al público, después la puedes ocultar."
    >
      <LeonixTextarea
        label="Dirección completa"
        helper="Incluye calle, número y referencias que te ayuden a ubicarlo por dentro."
        rows={2}
        value={value.direccionCompleta}
        onChange={(e) => onChange({ ...value, direccionCompleta: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Ciudad"
          value={value.ciudad}
          onChange={(e) => onChange({ ...value, ciudad: e.target.value })}
        />
        <LeonixTextField
          label="Estado"
          value={value.estado}
          onChange={(e) => onChange({ ...value, estado: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Código postal"
          value={value.codigoPostal}
          onChange={(e) => onChange({ ...value, codigoPostal: e.target.value })}
        />
        <LeonixTextField
          label="Colonia, zona o fraccionamiento"
          helper="Escribe la colonia, zona o fraccionamiento para ubicar mejor la propiedad."
          value={value.coloniaZona}
          onChange={(e) => onChange({ ...value, coloniaZona: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Referencia de ubicación"
        optional
        helper="Ej.: cerca de parque, entre calles, punto de referencia."
        value={value.referenciaUbicacion}
        onChange={(e) => onChange({ ...value, referenciaUbicacion: e.target.value })}
      />
      <LeonixCheckboxRow
        label="Ocultar dirección exacta al público"
        helper="Si la activas, mostramos zona aproximada según lo que captures abajo."
        checked={value.ocultarDireccionExacta}
        onChange={(v) => onChange({ ...value, ocultarDireccionExacta: v })}
      />
      <LeonixTextField
        label="Área aproximada en mapa / punto"
        optional
        helper="Describe el punto aproximado o cómo quieres que se vea en mapa."
        value={value.puntoMapaNotas}
        onChange={(e) => onChange({ ...value, puntoMapaNotas: e.target.value })}
      />
      <LeonixTextField
        label="Área aproximada (si ocultas dirección)"
        optional
        helper="Ej.: zona norte, a 5 min de la plaza."
        value={value.areaAproximada}
        onChange={(e) => onChange({ ...value, areaAproximada: e.target.value })}
      />
    </SectionShell>
  );
}
