import type { LeonixBRNegocioRedes } from "../schema/leonixBrNegocioForm";
import { LeonixTextarea, LeonixTextField } from "../components/LeonixField";
import { SectionShell } from "../components/SectionShell";

export function RedesYEnlacesSection({
  value,
  onChange,
}: {
  value: LeonixBRNegocioRedes;
  onChange: (next: LeonixBRNegocioRedes) => void;
}) {
  return (
    <SectionShell
      title="Redes y enlaces"
      description="Pega la URL completa de tu red social o sitio web. Solo agrega enlaces que sí quieras mostrar al público."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LeonixTextField label="Facebook" optional value={value.facebook} onChange={(e) => onChange({ ...value, facebook: e.target.value })} />
        <LeonixTextField
          label="Instagram"
          optional
          value={value.instagram}
          onChange={(e) => onChange({ ...value, instagram: e.target.value })}
        />
        <LeonixTextField
          label="LinkedIn"
          optional
          value={value.linkedin}
          onChange={(e) => onChange({ ...value, linkedin: e.target.value })}
        />
        <LeonixTextField label="YouTube" optional value={value.youtube} onChange={(e) => onChange({ ...value, youtube: e.target.value })} />
        <LeonixTextField label="TikTok" optional value={value.tiktok} onChange={(e) => onChange({ ...value, tiktok: e.target.value })} />
        <LeonixTextField
          label="Link de WhatsApp"
          optional
          value={value.whatsappLink}
          onChange={(e) => onChange({ ...value, whatsappLink: e.target.value })}
        />
      </div>
      <LeonixTextField
        label="URL para agendar cita"
        optional
        value={value.urlAgendarCita}
        onChange={(e) => onChange({ ...value, urlAgendarCita: e.target.value })}
      />
      <LeonixTextField
        label="URL de perfil profesional"
        optional
        value={value.urlPerfilProfesional}
        onChange={(e) => onChange({ ...value, urlPerfilProfesional: e.target.value })}
      />
      <LeonixTextField
        label="Sitio web principal"
        optional
        value={value.websitePrincipal}
        onChange={(e) => onChange({ ...value, websitePrincipal: e.target.value })}
      />
      <LeonixTextarea
        label="Enlaces personalizados"
        optional
        helper="Una URL por línea si necesitas más."
        rows={3}
        value={value.enlacesPersonalizados}
        onChange={(e) => onChange({ ...value, enlacesPersonalizados: e.target.value })}
      />
    </SectionShell>
  );
}
