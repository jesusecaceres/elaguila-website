import type { LeonixBRNegocioTipoPublicacion } from "../schema/leonixBrNegocioForm";
import { LeonixSelect, LeonixTextarea } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function TipoPublicacionSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioTipoPublicacion;
  onChange: (next: LeonixBRNegocioTipoPublicacion) => void;
}) {
  return (
    <SectionShell
      title="Tipo de publicación"
      description="Define cómo quieres posicionar este anuncio dentro de Leonix Clasificados."
    >
      <p className="text-sm font-semibold text-[#111111]">¿Cómo vas a publicar este inmueble?</p>
      <div className="grid gap-2 rounded-xl border border-dashed border-black/15 bg-white/80 p-3 text-sm text-[#111111]/80">
        <p>
          <span className="font-semibold text-[#111111]">Negocio o profesional</span> — Para inmobiliarias, desarrolladores y
          agentes certificados.
        </p>
        <p>
          <span className="font-semibold text-[#111111]">Vendedor particular</span> — Para propietarios que publican directo.
        </p>
        <p className="text-xs text-[#111111]/60">Estás en la ruta de negocio; aquí ajustas el matiz de tu publicación.</p>
      </div>
      <LeonixSelect
        label="Tipo de publicación"
        helper="Selecciona la opción que mejor describe tu caso."
        value={value.modoPublicacion}
        onChange={(e) => onChange({ ...value, modoPublicacion: e.target.value })}
      >
        <option value="negocio_profesional">Negocio o profesional</option>
        <option value="particular">Vendedor particular</option>
        <option value="mixto">Otro / mixto</option>
      </LeonixSelect>
      <LeonixTextarea
        label="Notas internas"
        optional
        helper="Para uso del equipo (visibilidad, plan, etc.). No es copy público."
        rows={2}
        value={value.notasInternas}
        onChange={(e) => onChange({ ...value, notasInternas: e.target.value })}
      />
    </SectionShell>
  );
}
