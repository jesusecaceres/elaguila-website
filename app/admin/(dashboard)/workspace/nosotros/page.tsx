import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";

const TOPICS = [
  {
    title: "Historia y posicionamiento",
    body: "Titular, lead, misión, visión y valores — todo se guarda en el editor y se muestra en `/about`.",
  },
  {
    title: "Equipo y liderazgo",
    body: "Galería de equipo o biografías extensas aún no tienen campos dedicados; el texto largo puede ir en lead/valores hasta que exista sección propia.",
  },
  {
    title: "Medios y credibilidad",
    body: "Imagen opcional (URL) en el editor; logos de partners en bloque adicional siguen siendo decisión de diseño (no hay carrusel persistido aún).",
  },
  {
    title: "Llamadas a la acción",
    body: "Dos CTAs con URL (p. ej. contacto y tienda). Alinea mensajes con Contacto y con la barra global si aplica.",
  },
] as const;

export default function AdminWorkspaceNosotrosPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nosotros — quiénes somos"
        subtitle="La página pública es `/about` (textos bilingües desde la base). El mapa de bloques de abajo es guía de capacitación; el editor real está en Contenido."
        eyebrow="Workspace · Nosotros"
        helperText="Usuarios, pagos y soporte siguen en la barra lateral global. No uses esta página para pedidos de Tienda."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <strong>Contenido reservado (BD):</strong>{" "}
        <Link href="/admin/workspace/nosotros/content" className={`${adminBtnSecondary} ml-2 inline-flex`}>
          Editor de contenido (`/about`)
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">Qué controla este workspace:</strong> la página pública `/about`, no operaciones globales. Para datos transversales del sitio, usa{" "}
        <Link href="/admin/site-settings" className="font-bold text-[#6B5B2E] underline">
          ajustes globales
        </Link>
        .
      </p>

      <div className="grid gap-4">
        {TOPICS.map((b) => (
          <section key={b.title} className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">{b.title}</h2>
            <p className="mt-2 text-sm text-[#5C5346]/95">{b.body}</p>
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
