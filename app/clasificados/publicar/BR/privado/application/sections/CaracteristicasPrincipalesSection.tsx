import type { LeonixBRPrivadoCaracteristicas } from "../schema/leonixBrPrivadoForm";
import { LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function CaracteristicasPrincipalesSection({
  value,
  onChange,
}: {
  value: LeonixBRPrivadoCaracteristicas;
  onChange: (next: LeonixBRPrivadoCaracteristicas) => void;
}) {
  return (
    <SectionShell
      title="Características principales"
      description="Si no tienes una medida exacta, usa la más cercana disponible."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <LeonixTextField label="Recámaras" value={value.recamaras} onChange={(e) => onChange({ ...value, recamaras: e.target.value })} />
        <LeonixTextField
          label="Baños completos"
          value={value.banosCompletos}
          onChange={(e) => onChange({ ...value, banosCompletos: e.target.value })}
        />
        <LeonixTextField
          label="Medios baños"
          optional
          value={value.mediosBanos}
          onChange={(e) => onChange({ ...value, mediosBanos: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Construcción (pies²)"
          value={value.construccionPies2}
          onChange={(e) => onChange({ ...value, construccionPies2: e.target.value })}
        />
        <LeonixTextField
          label="Terreno (pies²)"
          optional
          value={value.terrenoPies2}
          onChange={(e) => onChange({ ...value, terrenoPies2: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Estacionamientos"
          optional
          value={value.estacionamientos}
          onChange={(e) => onChange({ ...value, estacionamientos: e.target.value })}
        />
        <LeonixTextField
          label="Año de construcción"
          optional
          value={value.anioConstruccion}
          onChange={(e) => onChange({ ...value, anioConstruccion: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Estado de conservación"
        optional
        value={value.estadoConservacion}
        onChange={(e) => onChange({ ...value, estadoConservacion: e.target.value })}
      />
    </SectionShell>
  );
}
