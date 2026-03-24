"use client";

import Image from "next/image";
import type { LeonixBRPrivadoAnunciante } from "../schema/leonixBrPrivadoForm";
import { LeonixSelect, LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function AnuncianteSection({
  value,
  onChange,
  onPickFoto,
}: {
  value: LeonixBRPrivadoAnunciante;
  onChange: (next: LeonixBRPrivadoAnunciante) => void;
  onPickFoto: (files: FileList | null) => void;
}) {
  return (
    <SectionShell
      title="Datos del anunciante"
      description="Este dato ayuda a generar más confianza. Solo muestra lo que te sientas cómodo compartiendo."
    >
      <LeonixTextField label="Nombre" value={value.nombre} onChange={(e) => onChange({ ...value, nombre: e.target.value })} />
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#111111]">Foto (opcional)</p>
        <label className="mt-2 inline-block cursor-pointer rounded-xl border border-dashed border-black/20 bg-[#FAFAFA] px-4 py-2 text-sm font-semibold">
          Subir foto
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFoto(e.target.files)} />
        </label>
        {value.fotoDataUrl ? (
          <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-full border border-black/10">
            <Image src={value.fotoDataUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Teléfono"
          value={value.telefono}
          onChange={(e) => onChange({ ...value, telefono: e.target.value })}
        />
        <LeonixTextField
          label="WhatsApp"
          optional
          value={value.whatsapp}
          onChange={(e) => onChange({ ...value, whatsapp: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Correo"
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
      />
      <LeonixSelect
        label="Método preferido de contacto"
        value={value.metodoContactoPreferido}
        onChange={(e) => onChange({ ...value, metodoContactoPreferido: e.target.value })}
      >
        <option value="">Selecciona…</option>
        <option value="llamada">Llamada</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="correo">Correo</option>
      </LeonixSelect>
      <LeonixTextField
        label="Horarios para responder"
        optional
        value={value.horariosResponder}
        onChange={(e) => onChange({ ...value, horariosResponder: e.target.value })}
      />
      <LeonixTextField
        label="Idiomas"
        optional
        value={value.idiomas}
        onChange={(e) => onChange({ ...value, idiomas: e.target.value })}
      />
      <LeonixSelect
        label="Relación con la propiedad"
        value={value.relacionPropiedad}
        onChange={(e) => onChange({ ...value, relacionPropiedad: e.target.value })}
      >
        <option value="">Selecciona…</option>
        <option value="dueno">Soy dueño o dueña</option>
        <option value="familiar">Familiar</option>
        <option value="admin">Administrador(a)</option>
      </LeonixSelect>
      <LeonixTextarea
        label="Mensaje corto"
        optional
        rows={3}
        helper="Una frase humana ayuda: quién eres y por qué vendes o rentas."
        value={value.mensajeCorto}
        onChange={(e) => onChange({ ...value, mensajeCorto: e.target.value })}
      />
    </SectionShell>
  );
}
