import type { LeonixBRNegocioContactoCta } from "../schema/leonixBrNegocioForm";
import { LeonixCheckboxRow, LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function ContactoCTASection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioContactoCta;
  onChange: (next: LeonixBRNegocioContactoCta) => void;
}) {
  return (
    <SectionShell
      title="Contacto y CTA"
      description="Define cómo quieres que te contacten y qué botones o mensajes son prioridad."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="CTA principal"
          optional
          helper="Ej.: Llamar ahora, WhatsApp, Agendar visita."
          value={value.ctaPrincipal}
          onChange={(e) => onChange({ ...value, ctaPrincipal: e.target.value })}
        />
        <LeonixTextField
          label="CTA secundario"
          optional
          value={value.ctaSecundario}
          onChange={(e) => onChange({ ...value, ctaSecundario: e.target.value })}
        />
      </div>
      <LeonixCheckboxRow
        label="Mostrar teléfono en la ficha"
        checked={value.mostrarTelefono}
        onChange={(v) => onChange({ ...value, mostrarTelefono: v })}
      />
      <LeonixCheckboxRow
        label="Permitir mensajes"
        checked={value.permitirMensajes}
        onChange={(v) => onChange({ ...value, permitirMensajes: v })}
      />
      <LeonixCheckboxRow
        label="Permitir solicitud de visita"
        checked={value.permitirSolicitudVisita}
        onChange={(v) => onChange({ ...value, permitirSolicitudVisita: v })}
      />
      <LeonixTextField
        label="Tiempo estimado de respuesta"
        optional
        value={value.tiempoRespuestaEstimado}
        onChange={(e) => onChange({ ...value, tiempoRespuestaEstimado: e.target.value })}
      />
      <LeonixTextarea
        label="Disponibilidad general"
        optional
        rows={2}
        value={value.disponibilidadGeneral}
        onChange={(e) => onChange({ ...value, disponibilidadGeneral: e.target.value })}
      />
    </SectionShell>
  );
}
