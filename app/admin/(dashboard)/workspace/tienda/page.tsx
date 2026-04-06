import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";

const AREAS = [
  {
    title: "Pedidos (inbox)",
    body: "Bandeja de órdenes self-serve: estados, notas internas, archivos del cliente. El contador sin leer sigue en la barra superior.",
    href: "/admin/tienda/orders",
    cta: "Abrir pedidos",
  },
  {
    title: "Catálogo (artículos)",
    body: "Alta/edición de ítems, visibilidad, textos y metadatos de producto. Las rutas de CRUD no cambian.",
    href: "/admin/tienda/catalog",
    cta: "Abrir catálogo",
  },
  {
    title: "Imágenes y foto principal",
    body: "Gestión de activos por ítem y elección de imagen principal — dentro de cada ficha del catálogo.",
    href: "/admin/tienda/catalog",
    cta: "Ir al catálogo",
  },
  {
    title: "Precios y reglas",
    body: "Campos de precio y notas por ítem en la ficha; reglas de visibilidad y modo self-serve según el registro.",
    href: "/admin/tienda/catalog",
    cta: "Editar en catálogo",
  },
  {
    title: "Destacados en vitrina",
    body: "Marcar ítems para el escaparate público (`featuredStorefront` en catálogo admin + consultas públicas).",
    href: "/admin/tienda/catalog",
    cta: "Gestionar destacados",
  },
  {
    title: "Categorías públicas (referencia)",
    body: "Las familias y slugs de Tienda viven en código/registro de producto; esta tarjeta enlaza al catálogo para alinear contenido con cada categoría.",
    href: "/admin/tienda/catalog",
    cta: "Ver ítems por categoría",
  },
] as const;

export default function AdminWorkspaceTiendaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Tienda — operación de la vitrina"
        subtitle="Todo el CRUD real sigue en las rutas /admin/tienda/catalog y /admin/tienda/orders. Esta página agrupa el mapa mental del equipo: qué tocar para pedidos, fotos, precios y destacados."
        eyebrow="Workspace · Tienda"
      />

      <div className={`${adminCardBase} mb-6 border-[#C9B46A]/35 bg-[#FFFCF7] p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Cómo usar este workspace</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Las tarjetas son accesos directos al mismo admin que ya conoces; no movimos formularios para no romper flujos probados. El contador de pedidos sin leer sigue en la campana del encabezado y en el Dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((a) => (
          <div key={a.title} className={`${adminCardBase} p-5`}>
            <h2 className="font-bold text-[#1E1810]">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{a.body}</p>
            <Link href={a.href} className={`${adminBtnSecondary} mt-4 inline-flex`}>
              {a.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
