"use client";

import Image from "next/image";
import type { LeonixBRNegocioNegocio } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function NegocioSection({
  value,
  onChange,
  onPickLogoFile,
}: {
  value: LeonixBRNegocioNegocio;
  onChange: (next: LeonixBRNegocioNegocio) => void;
  onPickLogoFile: (files: FileList | null) => void;
}) {
  return (
    <SectionShell
      title="Negocio / inmobiliaria / brokerage"
      description="Escribe el nombre comercial tal como quieres que se vea en la ficha del anuncio. Sube el logo en buena calidad para reforzar la confianza del negocio."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Nombre comercial"
          value={value.nombreComercial}
          onChange={(e) => onChange({ ...value, nombreComercial: e.target.value })}
        />
        <LeonixTextField
          label="Nombre legal"
          optional
          value={value.nombreLegal}
          onChange={(e) => onChange({ ...value, nombreLegal: e.target.value })}
        />
      </div>
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#111111]">Logo del negocio</p>
        <p className="mt-1 text-xs text-[#111111]/65">PNG o JPG en buena resolución se ve mejor en desktop y móvil.</p>
        <label className="mt-3 inline-block cursor-pointer rounded-xl border border-dashed border-black/20 bg-[#FAFAFA] px-4 py-2 text-sm font-semibold hover:bg-[#F0F0F0]">
          Subir logo
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickLogoFile(e.target.files)} />
        </label>
        {value.logoDataUrl ? (
          <div className="relative mt-3 h-20 w-40">
            <Image src={value.logoDataUrl} alt="" fill className="object-contain" unoptimized />
          </div>
        ) : null}
      </div>
      <LeonixTextField
        label="Nombre del brokerage"
        optional
        value={value.brokerageName}
        onChange={(e) => onChange({ ...value, brokerageName: e.target.value })}
      />
      <LeonixTextField
        label="Sitio web"
        optional
        value={value.website}
        onChange={(e) => onChange({ ...value, website: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Teléfono de oficina"
          value={value.telefonoOficina}
          onChange={(e) => onChange({ ...value, telefonoOficina: e.target.value })}
        />
        <LeonixTextField
          label="Email de oficina"
          type="email"
          value={value.emailOficina}
          onChange={(e) => onChange({ ...value, emailOficina: e.target.value })}
        />
      </div>
      <LeonixTextarea
        label="Dirección de oficina"
        optional
        rows={2}
        value={value.direccionOficina}
        onChange={(e) => onChange({ ...value, direccionOficina: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Licencia del negocio / brokerage"
          optional
          value={value.licenciaNegocio}
          onChange={(e) => onChange({ ...value, licenciaNegocio: e.target.value })}
        />
        <LeonixTextField
          label="Años de experiencia"
          optional
          value={value.aniosExperiencia}
          onChange={(e) => onChange({ ...value, aniosExperiencia: e.target.value })}
        />
      </div>
      <LeonixTextarea
        label="Descripción del negocio"
        optional
        rows={3}
        value={value.descripcionNegocio}
        onChange={(e) => onChange({ ...value, descripcionNegocio: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField
          label="Horarios de atención"
          optional
          value={value.horariosAtencion}
          onChange={(e) => onChange({ ...value, horariosAtencion: e.target.value })}
        />
        <LeonixTextField
          label="Idiomas"
          optional
          value={value.idiomas}
          onChange={(e) => onChange({ ...value, idiomas: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="Cobertura / área de servicio"
        optional
        value={value.coberturaArea}
        onChange={(e) => onChange({ ...value, coberturaArea: e.target.value })}
      />
    </SectionShell>
  );
}
