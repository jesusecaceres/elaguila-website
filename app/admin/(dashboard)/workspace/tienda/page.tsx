import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";

type TiendaWorkspaceArea = {
  title: string;
  body: string;
  href: string;
  cta: string;
  openInNewTab?: boolean;
};

const AREAS: TiendaWorkspaceArea[] = [
  {
    title: "Vitrina pública",
    body: "Así ve el visitante el escaparate en `/tienda`. El contenido editable (textos, fotos, precios, visibilidad) se gestiona en el catálogo admin.",
    href: "/tienda",
    cta: "Abrir vitrina en nueva pestaña",
    openInNewTab: true,
  },
  {
    title: "Categorías de producto",
    body: "Familias y slugs de Tienda viven en el registro de categorías del código; usa el listado del catálogo para alinear cada artículo con su categoría pública.",
    href: "/admin/tienda/catalog",
    cta: "Ir al catálogo",
  },
  {
    title: "Artículos del catálogo",
    body: "Alta, edición, visibilidad y metadatos por ítem. Es el mismo CRUD que ya usas: rutas bajo `/admin/tienda/catalog`.",
    href: "/admin/tienda/catalog",
    cta: "Abrir catálogo",
  },
  {
    title: "Imágenes y foto principal",
    body: "Subidas por producto y elección de imagen principal dentro de cada ficha del catálogo (sin flujo paralelo).",
    href: "/admin/tienda/catalog",
    cta: "Elegir en cada artículo",
  },
  {
    title: "Precios y reglas",
    body: "Precio base, etiqueta visible, modo de precios y CTA por ítem en la ficha; reglas de self-serve según el tipo de producto.",
    href: "/admin/tienda/catalog",
    cta: "Editar en catálogo",
  },
  {
    title: "Destacados en vitrina",
    body: "Marcar ítems para el escaparate (`featuredStorefront` y consultas públicas) desde la administración del catálogo.",
    href: "/admin/tienda/catalog",
    cta: "Gestionar destacados",
  },
  {
    title: "Pedidos (inbox)",
    body: "Bandeja de órdenes self-serve: estados, notas internas y archivos del cliente. El contador sin leer sigue en el encabezado y en el Dashboard global.",
    href: "/admin/tienda/orders",
    cta: "Abrir pedidos",
  },
];

export default function AdminWorkspaceTiendaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Tienda — workspace de la vitrina"
        subtitle="Mapa operativo del equipo: mismas rutas de CRUD que ya funcionan bajo `/admin/tienda/*`. Esta página no reemplaza formularios; orienta qué abrir para cada tarea."
        eyebrow="Workspace · Tienda"
        helperText="Usa la franja “Dentro de Tienda” cuando estés en pedidos o catálogo para saltar entre áreas sin volver al menú global."
      />

      <div className={`${adminCardBase} mb-6 border-[#C9B46A]/35 bg-[#FFFCF7] p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Textos e imágenes de la vitrina</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Editor con guardado en base: hero, franja promo bajo el hero, orden de tarjetas de categoría, portadas por slug y textos de secciones —{" "}
          <Link href="/admin/workspace/tienda/storefront" className="font-bold text-[#6B5B2E] underline">
            abrir editor de vitrina
          </Link>
          .
        </p>
        <p className="mt-3 font-semibold text-[#1E1810]">Orden sugerido para capacitación</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-[#7A7164]">
          <li>Vitrina pública → ver resultado.</li>
          <li>Catálogo → artículos, fotos, precios y destacados.</li>
          <li>Pedidos → cumplimiento después de la compra.</li>
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AREAS.map((a) => (
          <div key={a.title} className={`${adminCardBase} p-5`}>
            <h2 className="font-bold text-[#1E1810]">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{a.body}</p>
            <Link
              href={a.href}
              className={`${adminBtnSecondary} mt-4 inline-flex min-h-[44px] items-center sm:min-h-0`}
              {...(a.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {a.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
