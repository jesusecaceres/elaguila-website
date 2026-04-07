import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase } from "../../../_components/adminTheme";

const TOPICS = [
  {
    title: "Canales y horario",
    body: "Teléfono, correo, horario y dirección viven en el editor persistente (Supabase). No hay campos duplicados en esta página de resumen.",
  },
  {
    title: "Mapa y avisos",
    body: "URL de mapa y aviso superior opcional — también en el editor. El envío del formulario sigue el mismo componente global (lógica de API no se edita aquí).",
  },
  {
    title: "Tarjeta Tienda",
    body: "Título, cuerpo y CTA del recuadro que enlaza a ayuda Tienda — editables en el editor; vacío = texto por defecto del código.",
  },
] as const;

export default function AdminWorkspaceContactoPage() {
  return (
    <div>
      <AdminPageHeader
        title="Contacto — cómo te encuentran"
        subtitle="El único formulario guardado para `/contacto` está en el editor enlazado abajo. Esta tarjeta resume alcance; no hay campos guardados aquí."
        eyebrow="Workspace · Contacto"
        helperText="Pedidos de Tienda (inbox) siguen en Pedidos globales. Incidencias internas en Support. Coordinar CTAs con Nosotros (`/about`)."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <strong>Editor persistente (BD):</strong>{" "}
        <Link href="/admin/workspace/contacto/content" className="font-bold underline">
          Abrir formulario de `/contacto`
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-[#5C5346]">
        <strong className="text-[#1E1810]">Qué controla este workspace:</strong> la página pública Contacto y el bloque de texto alrededor del formulario. Para{" "}
        <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
          Support
        </Link>{" "}
        (cola operativa) y{" "}
        <Link href="/admin/workspace/nosotros" className="font-bold text-[#6B5B2E] underline">
          Nosotros
        </Link>{" "}
        usa los enlaces de la barra lateral.
      </p>

      <div className="grid gap-4">
        {TOPICS.map((b) => (
          <section key={b.title} className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">{b.title}</h2>
            <p className="mt-2 text-sm text-[#5C5346]/95">{b.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
