import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminInputClass } from "../../../_components/adminTheme";

const BLOCKS = [
  {
    title: "Canales de contacto",
    hint: "Teléfono, correo y reglas de desvío (quién contesta ventas vs soporte). Un solo lugar “oficial” evita confusiones en redes.",
    fields: ["Teléfono visible", "Email público", "Nota interna de enrutamiento"],
  },
  {
    title: "Horarios y disponibilidad",
    hint: "Texto que ve el visitante (L–V, festivos, cierres). Alinea con mensajes de Tienda si aplica.",
    fields: ["Copy de horario (ES)", "Aviso de cierre temporal"],
  },
  {
    title: "Ubicación y mapa",
    hint: "Dirección formateada, enlace a Maps, o iframe embed — documentar aquí antes de persistir.",
    fields: ["Dirección multilínea", "URL de mapa / embed"],
  },
  {
    title: "Formulario y CTAs",
    hint: "Título del formulario, texto de privacidad breve, y qué pasa tras enviar (correo a soporte, ticket, etc.).",
    fields: ["Título del bloque de formulario", "Texto de ayuda bajo el botón Enviar"],
  },
] as const;

export default function AdminWorkspaceContactoPage() {
  return (
    <div>
      <AdminPageHeader
        title="Contacto — cómo te encuentran"
        subtitle="Experiencia pública de contacto: datos de llegada, horarios, mapa y mensajes del formulario. Campos guía hasta exista almacén de configuración."
        eyebrow="Workspace · Contacto"
      />

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">Qué controla este workspace:</strong> la página Contacto del sitio y mensajes coherentes con{" "}
        <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
          Support
        </Link>{" "}
        (operación) y con{" "}
        <Link href="/admin/workspace/nosotros" className="font-bold text-[#6B5B2E] underline">
          Nosotros
        </Link>{" "}
        (CTAs).
      </p>

      <div className="grid gap-5">
        {BLOCKS.map((b) => (
          <section key={b.title} className={`${adminCardBase} p-6`}>
            <h2 className="text-base font-bold text-[#1E1810]">{b.title}</h2>
            <p className="mt-1 text-sm text-[#7A7164]">{b.hint}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {b.fields.map((label) => (
                <div key={label}>
                  <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
                  <input className={adminInputClass} disabled placeholder="Campo guía — sin guardar aún" title={label} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
