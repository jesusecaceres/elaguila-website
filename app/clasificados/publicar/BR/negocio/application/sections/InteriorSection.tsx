import type { LeonixBRNegocioInterior } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function InteriorSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioInterior;
  onChange: (next: LeonixBRNegocioInterior) => void;
}) {
  const patch = (k: keyof LeonixBRNegocioInterior, v: string) => onChange({ ...value, [k]: v });
  return (
    <SectionShell
      title="Interior"
      description="Detalla el interior para que el cliente se imagine vivir o trabajar ahí."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Cocina" optional value={value.cocina} onChange={(e) => patch("cocina", e.target.value)} />
        <LeonixTextField label="Comedor" optional value={value.comedor} onChange={(e) => patch("comedor", e.target.value)} />
        <LeonixTextField label="Sala" optional value={value.sala} onChange={(e) => patch("sala", e.target.value)} />
        <LeonixTextField
          label="Cuarto de lavado"
          optional
          value={value.cuartoLavado}
          onChange={(e) => patch("cuartoLavado", e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Closets" optional value={value.closets} onChange={(e) => patch("closets", e.target.value)} />
        <LeonixTextField
          label="Aire acondicionado"
          optional
          value={value.aireAcondicionado}
          onChange={(e) => patch("aireAcondicionado", e.target.value)}
        />
        <LeonixTextField
          label="Calefacción"
          optional
          value={value.calefaccion}
          onChange={(e) => patch("calefaccion", e.target.value)}
        />
        <LeonixTextField
          label="Chimenea"
          optional
          value={value.chimenea}
          onChange={(e) => patch("chimenea", e.target.value)}
        />
      </div>
      <LeonixTextField
        label="Electrodomésticos incluidos"
        optional
        value={value.electrodomesticosIncluidos}
        onChange={(e) => patch("electrodomesticosIncluidos", e.target.value)}
      />
      <LeonixTextField label="Pisos" optional value={value.pisos} onChange={(e) => patch("pisos", e.target.value)} />
      <LeonixTextarea
        label="Interior (detalle general)"
        optional
        rows={3}
        value={value.interiorFeatures}
        onChange={(e) => patch("interiorFeatures", e.target.value)}
      />
      <LeonixTextarea
        label="Cocina (detalle)"
        optional
        rows={2}
        value={value.kitchenFeatures}
        onChange={(e) => patch("kitchenFeatures", e.target.value)}
      />
      <LeonixTextarea
        label="Comedor (detalle)"
        optional
        rows={2}
        value={value.diningDetails}
        onChange={(e) => patch("diningDetails", e.target.value)}
      />
      <LeonixTextarea
        label="Habitaciones / espacios"
        optional
        rows={2}
        value={value.roomDetails}
        onChange={(e) => patch("roomDetails", e.target.value)}
      />
    </SectionShell>
  );
}
