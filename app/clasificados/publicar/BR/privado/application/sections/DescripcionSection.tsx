import type { LeonixBRPrivadoDescripcion } from "../schema/leonixBrPrivadoForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function DescripcionSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoDescripcion;
  onChange: (next: LeonixBRPrivadoDescripcion) => void;
}) {
  return (
    <SectionShell
      title="Descripción"
      description="Describe lo mejor del inmueble sin inventar datos. Aquí se nota si el anuncio es confiable."
    >
      <LeonixTextField
        label="Resumen corto"
        optional
        value={value.resumen}
        onChange={(e) => onChange({ ...value, resumen: e.target.value })}
      />
      <LeonixTextarea
        label="Descripción completa"
        rows={6}
        value={value.descripcionCompleta}
        onChange={(e) => onChange({ ...value, descripcionCompleta: e.target.value })}
      />
    </SectionShell>
  );
}
