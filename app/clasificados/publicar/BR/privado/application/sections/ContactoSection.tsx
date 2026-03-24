import type { LeonixBRPrivadoContacto } from "../schema/leonixBrPrivadoForm";
import { LeonixCheckboxRow, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function ContactoSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoContacto;
  onChange: (next: LeonixBRPrivadoContacto) => void;
}) {
  return (
    <SectionShell title="Contacto" description="Controla cómo te pueden contactar sin complicarte.">
      <LeonixCheckboxRow
        label="Permitir llamadas"
        checked={value.permitirLlamadas}
        onChange={(v) => onChange({ ...value, permitirLlamadas: v })}
      />
      <LeonixCheckboxRow
        label="Permitir WhatsApp"
        checked={value.permitirWhatsapp}
        onChange={(v) => onChange({ ...value, permitirWhatsapp: v })}
      />
      <LeonixCheckboxRow
        label="Permitir correo"
        checked={value.permitirEmail}
        onChange={(v) => onChange({ ...value, permitirEmail: v })}
      />
      <LeonixCheckboxRow
        label="Permitir solicitud de visita"
        checked={value.solicitarVisita}
        onChange={(v) => onChange({ ...value, solicitarVisita: v })}
      />
      <LeonixTextField
        label="Tiempo estimado de respuesta"
        optional
        value={value.tiempoRespuesta}
        onChange={(e) => onChange({ ...value, tiempoRespuesta: e.target.value })}
      />
    </SectionShell>
  );
}
