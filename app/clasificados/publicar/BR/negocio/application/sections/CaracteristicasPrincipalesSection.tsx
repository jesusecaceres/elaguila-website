import type { LeonixBRNegocioCaracteristicas } from "../schema/leonixBrNegocioForm";
import { LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function CaracteristicasPrincipalesSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioCaracteristicas;
  onChange: (next: LeonixBRNegocioCaracteristicas) => void;
}) {
  return (
    <SectionShell
      title="Características principales"
      description="Incluye los datos principales para que el cliente entienda rápido el tamaño y tipo del inmueble. Si no tienes una medida exacta, usa la más cercana disponible."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <LeonixTextField
          label="Recámaras"
          inputMode="numeric"
          value={value.recamaras}
          onChange={(e) => onChange({ ...value, recamaras: e.target.value })}
        />
        <LeonixTextField
          label="Baños completos"
          inputMode="numeric"
          value={value.banosCompletos}
          onChange={(e) => onChange({ ...value, banosCompletos: e.target.value })}
        />
        <LeonixTextField
          label="Medios baños"
          inputMode="numeric"
          value={value.mediosBanos}
          onChange={(e) => onChange({ ...value, mediosBanos: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Construcción (pies²)"
          inputMode="decimal"
          value={value.construccionPies2}
          onChange={(e) => onChange({ ...value, construccionPies2: e.target.value })}
        />
        <LeonixTextField
          label="Terreno (pies²)"
          inputMode="decimal"
          value={value.terrenoPies2}
          onChange={(e) => onChange({ ...value, terrenoPies2: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <LeonixTextField
          label="Niveles"
          value={value.niveles}
          onChange={(e) => onChange({ ...value, niveles: e.target.value })}
        />
        <LeonixTextField
          label="Estacionamientos"
          value={value.estacionamientos}
          onChange={(e) => onChange({ ...value, estacionamientos: e.target.value })}
        />
        <LeonixTextField
          label="Año de construcción"
          value={value.anioConstruccion}
          onChange={(e) => onChange({ ...value, anioConstruccion: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Estado de conservación"
          value={value.estadoConservacion}
          onChange={(e) => onChange({ ...value, estadoConservacion: e.target.value })}
        />
        <LeonixTextField
          label="Estilo / diseño"
          optional
          value={value.estiloDiseno}
          onChange={(e) => onChange({ ...value, estiloDiseno: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Condición general"
        optional
        helper="Ej.: listo para habitar, necesita remodelación ligera."
        value={value.condicionGeneral}
        onChange={(e) => onChange({ ...value, condicionGeneral: e.target.value })}
      />
    </SectionShell>
  );
}
