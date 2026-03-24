import type { LeonixBRPrivadoDetalleExtra } from "../schema/leonixBrPrivadoForm";
import { LeonixTextarea } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function DetalleAdicionalSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoDetalleExtra;
  onChange: (next: LeonixBRPrivadoDetalleExtra) => void;
}) {
  return (
    <SectionShell
      title="Interior, exterior y servicios"
      description="Solo lo que aplique. Si no lo tienes, lo puedes dejar vacío."
    >
      <LeonixTextarea
        label="Interior"
        optional
        rows={3}
        value={value.interior}
        onChange={(e) => onChange({ ...value, interior: e.target.value })}
      />
      <LeonixTextarea
        label="Exterior"
        optional
        rows={3}
        value={value.exterior}
        onChange={(e) => onChange({ ...value, exterior: e.target.value })}
      />
      <LeonixTextarea
        label="Servicios / comunidad"
        optional
        rows={3}
        value={value.servicios}
        onChange={(e) => onChange({ ...value, servicios: e.target.value })}
      />
    </SectionShell>
  );
}
