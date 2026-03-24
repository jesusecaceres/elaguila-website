import type { LeonixBRNegocioDescripcionMarketing } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function DescripcionMarketingSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioDescripcionMarketing;
  onChange: (next: LeonixBRNegocioDescripcionMarketing) => void;
}) {
  const patch = (k: keyof LeonixBRNegocioDescripcionMarketing, v: string) => onChange({ ...value, [k]: v });
  return (
    <SectionShell
      title="Descripción y marketing"
      description="Describe lo mejor de la propiedad de forma clara y convincente. Evita repetir solo medidas: aquí vende la experiencia de vivir o invertir en este inmueble."
    >
      <LeonixTextField
        label="Resumen corto"
        helper="Una línea fuerte para listados y chips."
        value={value.resumenCorto}
        onChange={(e) => patch("resumenCorto", e.target.value)}
      />
      <LeonixTextarea
        label="Descripción completa"
        rows={6}
        value={value.descripcionCompleta}
        onChange={(e) => patch("descripcionCompleta", e.target.value)}
      />
      <LeonixTextarea
        label="Highlights"
        optional
        rows={3}
        helper="Viñetas o frases cortas separadas por línea."
        value={value.highlights}
        onChange={(e) => patch("highlights", e.target.value)}
      />
      <LeonixTextField
        label="Chips destacados"
        optional
        helper="Palabras clave separadas por coma."
        value={value.chipsDestacados}
        onChange={(e) => patch("chipsDestacados", e.target.value)}
      />
      <LeonixTextarea
        label="Puntos fuertes de venta"
        optional
        rows={3}
        value={value.puntosFuertes}
        onChange={(e) => patch("puntosFuertes", e.target.value)}
      />
      <LeonixTextField
        label="Frase principal de marketing"
        optional
        value={value.fraseMarketing}
        onChange={(e) => patch("fraseMarketing", e.target.value)}
      />
      <LeonixTextarea
        label="Amenidades clave"
        optional
        rows={2}
        value={value.amenidadesClave}
        onChange={(e) => patch("amenidadesClave", e.target.value)}
      />
      <LeonixTextarea
        label="Notas del vecindario"
        optional
        rows={2}
        value={value.notasVecindario}
        onChange={(e) => patch("notasVecindario", e.target.value)}
      />
    </SectionShell>
  );
}
