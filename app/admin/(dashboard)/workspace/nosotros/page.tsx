import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary, adminInputClass } from "../../../_components/adminTheme";

const BLOCKS = [
  {
    title: "Historia y posicionamiento",
    hint: "Titular, párrafos largos, bloques de valores y línea de tiempo corta. Define el tono que verá el visitante en /nosotros.",
    fields: ["Titular principal (ES)", "Párrafo de apertura", "Bullets de valores (3–5)"],
  },
  {
    title: "Equipo y liderazgo",
    hint: "Quién está detrás de Leonix: roles, fotos opcionales, enlaces a LinkedIn o biografías breves.",
    fields: ["Sección “Equipo” visible sí/no", "Notas internas de actualización"],
  },
  {
    title: "Medios y credibilidad",
    hint: "Logotipos de partners, menciones en prensa, galería ligera. Mantén alineado con marca y peso de página.",
    fields: ["Carrusel / galería (referencia)", "PDF o enlaces de prensa"],
  },
  {
    title: "Llamadas a la acción",
    hint: "Botones primarios (contacto, trabajar con nosotros). Deben coincidir con mensajes del workspace Contacto.",
    fields: ["Texto botón primario", "URL o ancla destino"],
  },
] as const;

export default function AdminWorkspaceNosotrosPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nosotros — quiénes somos"
        subtitle="Todo lo que alimenta la sección pública “acerca de”: narrativa, equipo, medios y CTAs. Persistencia pendiente; esta vista enseña qué documentar antes de cablear CMS."
        eyebrow="Workspace · Nosotros"
        helperText="Cuando exista almacén, aquí vivirá el contenido de /nosotros. Usuarios, pagos y soporte siguen en la barra lateral global."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <strong>Contenido reservado (BD):</strong>{" "}
        <Link href="/admin/workspace/nosotros/content" className={`${adminBtnSecondary} ml-2 inline-flex`}>
          Editar borrador Nosotros
        </Link>
        <span className="ml-2 text-xs text-[#5C5346]">(aún sin ruta pública dedicada)</span>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">Qué controla este workspace:</strong> la futura página Nosotros del sitio público, no operaciones globales. Para datos transversales del sitio, usa{" "}
        <Link href="/admin/site-settings" className="font-bold text-[#6B5B2E] underline">
          ajustes globales
        </Link>
        .
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

      <div className={`${adminCardBase} mt-8 border-[#7A9E6F]/30 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Coordinación:</strong> revisa el workspace{" "}
          <Link href="/admin/workspace/contacto" className="font-bold underline">
            Contacto
          </Link>{" "}
          para que teléfonos, horarios y formularios no contradigan los botones de esta página.
        </p>
      </div>
    </div>
  );
}
