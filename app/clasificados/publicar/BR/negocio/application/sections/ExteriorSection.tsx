import type { LeonixBRNegocioExterior } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function ExteriorSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioExterior;
  onChange: (next: LeonixBRNegocioExterior) => void;
}) {
  const patch = (k: keyof LeonixBRNegocioExterior, v: string) => onChange({ ...value, [k]: v });
  return (
    <SectionShell title="Exterior" description="Exterior, terreno y estacionamiento: lo que se ve y lo que suma valor.">
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Patio" optional value={value.patio} onChange={(e) => patch("patio", e.target.value)} />
        <LeonixTextField label="Jardín" optional value={value.jardin} onChange={(e) => patch("jardin", e.target.value)} />
        <LeonixTextField label="Terraza" optional value={value.terraza} onChange={(e) => patch("terraza", e.target.value)} />
        <LeonixTextField label="Balcón" optional value={value.balcon} onChange={(e) => patch("balcon", e.target.value)} />
        <LeonixTextField label="Alberca" optional value={value.alberca} onChange={(e) => patch("alberca", e.target.value)} />
        <LeonixTextField
          label="Roof garden"
          optional
          value={value.roofGarden}
          onChange={(e) => patch("roofGarden", e.target.value)}
        />
      </div>
      <LeonixTextField label="Fachada" optional value={value.fachada} onChange={(e) => patch("fachada", e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Materiales de construcción"
          optional
          value={value.materialesConstruccion}
          onChange={(e) => patch("materialesConstruccion", e.target.value)}
        />
        <LeonixTextField label="Techo" optional value={value.techo} onChange={(e) => patch("techo", e.target.value)} />
      </div>
      <LeonixTextarea
        label="Lote / descripción del terreno"
        optional
        rows={2}
        value={value.loteTerreno}
        onChange={(e) => patch("loteTerreno", e.target.value)}
      />
      <LeonixTextarea
        label="Exterior (detalle general)"
        optional
        rows={2}
        value={value.exteriorFeatures}
        onChange={(e) => patch("exteriorFeatures", e.target.value)}
      />
      <LeonixTextarea
        label="Estacionamiento / cochera"
        optional
        rows={2}
        value={value.parkingDetails}
        onChange={(e) => patch("parkingDetails", e.target.value)}
      />
      <LeonixTextarea
        label="Detalle del lote"
        optional
        rows={2}
        value={value.lotDetails}
        onChange={(e) => patch("lotDetails", e.target.value)}
      />
    </SectionShell>
  );
}
