import type { LeonixBRNegocioEquipoAdicional } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function EquipoAdicionalSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioEquipoAdicional;
  onChange: (next: LeonixBRNegocioEquipoAdicional) => void;
}) {
  return (
    <SectionShell
      title="Equipo adicional"
      description="Contactos y roles extra para operaciones serias. Aquí solo capturamos datos; el layout público lo definimos después."
    >
      <LeonixTextField
        label="Co-agente"
        optional
        value={value.coAgente}
        onChange={(e) => onChange({ ...value, coAgente: e.target.value })}
      />
      <LeonixTextField
        label="Broker responsable"
        optional
        value={value.brokerResponsable}
        onChange={(e) => onChange({ ...value, brokerResponsable: e.target.value })}
      />
      <LeonixTextField
        label="Contacto de oficina"
        optional
        value={value.contactoOficina}
        onChange={(e) => onChange({ ...value, contactoOficina: e.target.value })}
      />
      <LeonixTextField
        label="Contacto secundario"
        optional
        value={value.contactoSecundario}
        onChange={(e) => onChange({ ...value, contactoSecundario: e.target.value })}
      />
      <LeonixTextField
        label="Contacto de préstamos / financiamiento"
        optional
        value={value.contactoPrestamos}
        onChange={(e) => onChange({ ...value, contactoPrestamos: e.target.value })}
      />
      <LeonixTextarea
        label="Más miembros del equipo"
        optional
        rows={3}
        value={value.masMiembrosEquipo}
        onChange={(e) => onChange({ ...value, masMiembrosEquipo: e.target.value })}
      />
      <LeonixTextField
        label="Compatibilidad con “más anuncios del negocio”"
        optional
        helper="Notas estructurales para cuando conectemos el rail de inventario."
        value={value.masAnunciosNegocioNotas}
        onChange={(e) => onChange({ ...value, masAnunciosNegocioNotas: e.target.value })}
      />
    </SectionShell>
  );
}
