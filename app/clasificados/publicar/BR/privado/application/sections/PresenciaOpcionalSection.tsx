import type { LeonixBRPrivadoPresencia } from "../schema/leonixBrPrivadoForm";
import { LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function PresenciaOpcionalSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoPresencia;
  onChange: (next: LeonixBRPrivadoPresencia) => void;
}) {
  return (
    <SectionShell
      title="Presencia opcional"
      description="Solo si quieres. No es obligatorio parecer una inmobiliaria."
    >
      <LeonixTextField
        label="Sitio web"
        optional
        helper="Pega el enlace completo."
        value={value.website}
        onChange={(e) => onChange({ ...value, website: e.target.value })}
      />
      <LeonixTextField
        label="Facebook"
        optional
        value={value.facebook}
        onChange={(e) => onChange({ ...value, facebook: e.target.value })}
      />
      <LeonixTextField
        label="Instagram"
        optional
        value={value.instagram}
        onChange={(e) => onChange({ ...value, instagram: e.target.value })}
      />
    </SectionShell>
  );
}
