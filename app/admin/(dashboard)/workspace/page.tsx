import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase } from "../../_components/adminTheme";

const CARDS = [
  {
    href: "/admin/workspace/home",
    title: "Home",
    body: "Portada: hero, avisos, destacados de Clasificados en la home y módulos visibles en `/`.",
    teach: "Empieza aquí si solo cambias la primera impresión del sitio.",
  },
  {
    href: "/admin/workspace/clasificados",
    title: "Clasificados",
    body: "Cola de anuncios, filtros, moderación En Venta, registro de categorías y reportes.",
    teach: "Operación diaria de anuncios — no confundir con Tienda.",
  },
  {
    href: "/admin/workspace/tienda",
    title: "Tienda",
    body: "Mapa hacia pedidos, catálogo real, imágenes, precios y destacados en vitrina.",
    teach: "El CRUD sigue en /admin/tienda/*; este workspace orienta al equipo.",
  },
  {
    href: "/admin/workspace/nosotros",
    title: "Nosotros",
    body: "Historia, equipo, medios y CTAs de la sección acerca de.",
    teach: "Narrativa de marca; enlaza bien con Contacto.",
  },
  {
    href: "/admin/workspace/revista",
    title: "Revista",
    body: "Número destacado, archivo y metadatos ligados al manifiesto de la revista.",
    teach: "Contenido editorial periódico, separado del catálogo de Tienda.",
  },
  {
    href: "/admin/workspace/contacto",
    title: "Contacto",
    body: "Teléfono, correo, horarios, mapa y copy del formulario público.",
    teach: "Datos que ve el visitante; soporte interno sigue en la barra lateral.",
  },
] as const;

export default function AdminWorkspaceHubPage() {
  return (
    <div>
      <AdminPageHeader
        title="Secciones del sitio (workspaces)"
        subtitle="Elige una sección para trabajar. La barra lateral izquierda es solo administración global (usuarios, pagos, etc.); este menú no copia el menú público."
        eyebrow="Workspace"
      />

      <div className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4 text-sm text-[#5C5346]">
        <p className="font-semibold text-[#1E1810]">Módulos que cruzan varias páginas</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Interruptores o listas que afectan más de una ruta viven en{" "}
          <Link href="/admin/site-settings" className="font-bold text-[#6B5B2E] underline">
            Ajustes globales del sitio
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`${adminCardBase} block p-5 transition hover:ring-2 hover:ring-[#C9B46A]/30`}
            title={c.teach}
          >
            <h2 className="text-lg font-bold text-[#1E1810]">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{c.body}</p>
            <p className="mt-3 text-xs italic text-[#9A9084]">{c.teach}</p>
            <span className="mt-4 inline-block text-xs font-bold text-[#6B5B2E] underline">Abrir workspace →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
