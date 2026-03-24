import type { LeonixBRNegocioServiciosComunidad } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function ServiciosComunidadSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioServiciosComunidad;
  onChange: (next: LeonixBRNegocioServiciosComunidad) => void;
}) {
  const patch = (k: keyof LeonixBRNegocioServiciosComunidad, v: string) => onChange({ ...value, [k]: v });
  return (
    <SectionShell
      title="Servicios, comunidad y datos financieros"
      description="Servicios, HOA, seguridad y notas útiles para quien busca en serio."
    >
      <LeonixTextarea
        label="Utilidades / servicios"
        optional
        rows={2}
        value={value.utilidadesServicios}
        onChange={(e) => patch("utilidadesServicios", e.target.value)}
      />
      <LeonixTextField
        label="Energía solar / green"
        optional
        value={value.energiaSolar}
        onChange={(e) => patch("energiaSolar", e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="HOA / comunidad"
          optional
          value={value.hoaComunidad}
          onChange={(e) => patch("hoaComunidad", e.target.value)}
        />
        <LeonixTextField
          label="Cuota HOA (aprox.)"
          optional
          value={value.cuotaHoa}
          onChange={(e) => patch("cuotaHoa", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Seguridad" optional value={value.seguridad} onChange={(e) => patch("seguridad", e.target.value)} />
        <LeonixTextField
          label="Acceso controlado"
          optional
          value={value.accesoControlado}
          onChange={(e) => patch("accesoControlado", e.target.value)}
        />
      </div>
      <LeonixTextarea
        label="Detalles financieros (notas)"
        optional
        helper="Sin asesoría legal; solo datos que quieras mostrar."
        rows={2}
        value={value.detallesFinancieros}
        onChange={(e) => patch("detallesFinancieros", e.target.value)}
      />
      <LeonixTextarea
        label="Detalles del listing (interno)"
        optional
        rows={2}
        value={value.detallesListing}
        onChange={(e) => patch("detallesListing", e.target.value)}
      />
      <LeonixTextField
        label="Impuestos / predial (notas)"
        optional
        value={value.taxParcelNotas}
        onChange={(e) => patch("taxParcelNotas", e.target.value)}
      />
      <LeonixTextarea
        label="Comunidad / vecindario"
        optional
        rows={2}
        value={value.comunidadVecindario}
        onChange={(e) => patch("comunidadVecindario", e.target.value)}
      />
      <LeonixTextField
        label="Escuelas / educación cercana"
        optional
        value={value.escuelas}
        onChange={(e) => patch("escuelas", e.target.value)}
      />
    </SectionShell>
  );
}
