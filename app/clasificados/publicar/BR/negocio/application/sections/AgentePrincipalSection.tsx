"use client";

import Image from "next/image";
import type { LeonixBRNegocioAgentePrincipal } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function AgentePrincipalSection({
  value,
  onChange,
  onPickFotoFile,
}: {
  value: LeonixBRNegocioAgentePrincipal;
  onChange: (next: LeonixBRNegocioAgentePrincipal) => void;
  onPickFotoFile: (files: FileList | null) => void;
}) {
  return (
    <SectionShell
      title="Agente principal"
      description="Agrega la información del agente principal que atenderá al cliente. Puedes incluir WhatsApp si quieres facilitar el primer contacto."
    >
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#111111]">Foto del agente</p>
        <label className="mt-2 inline-block cursor-pointer rounded-xl border border-dashed border-black/20 bg-[#FAFAFA] px-4 py-2 text-sm font-semibold hover:bg-[#F0F0F0]">
          Subir foto
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFotoFile(e.target.files)} />
        </label>
        {value.fotoDataUrl ? (
          <div className="relative mt-3 h-28 w-28 overflow-hidden rounded-full border border-black/10">
            <Image src={value.fotoDataUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Nombre completo"
          value={value.nombreCompleto}
          onChange={(e) => onChange({ ...value, nombreCompleto: e.target.value })}
        />
        <LeonixTextField
          label="Cargo / rol"
          optional
          value={value.cargoRol}
          onChange={(e) => onChange({ ...value, cargoRol: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Teléfono directo"
          value={value.telefonoDirecto}
          onChange={(e) => onChange({ ...value, telefonoDirecto: e.target.value })}
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
        value={value.correo}
        onChange={(e) => onChange({ ...value, correo: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Licencia individual"
          optional
          value={value.licenciaIndividual}
          onChange={(e) => onChange({ ...value, licenciaIndividual: e.target.value })}
        />
        <LeonixTextField
          label="Idiomas"
          optional
          value={value.idiomas}
          onChange={(e) => onChange({ ...value, idiomas: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Horarios"
          optional
          value={value.horarios}
          onChange={(e) => onChange({ ...value, horarios: e.target.value })}
        />
        <LeonixTextField
          label="URL de perfil"
          optional
          value={value.urlPerfil}
          onChange={(e) => onChange({ ...value, urlPerfil: e.target.value })}
        />
      </div>
      <LeonixTextarea
        label="Frase de presentación"
        optional
        rows={3}
        value={value.frasePresentacion}
        onChange={(e) => onChange({ ...value, frasePresentacion: e.target.value })}
      />
      <LeonixTextField
        label="Disponibilidad / tiempos de respuesta"
        optional
        value={value.disponibilidadRespuesta}
        onChange={(e) => onChange({ ...value, disponibilidadRespuesta: e.target.value })}
      />
    </SectionShell>
  );
}
