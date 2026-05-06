import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

type Truth = "TRUE" | "PARTIAL" | "MISSING" | "HONESTLY_DISABLED";

type HubCard = {
  title: string;
  purpose: string;
  /** Shown as «Ruta» (may be a pattern, not always a single clickable path). */
  routeLabel: string;
  /** When set, primary CTA uses this href; omit when no sensible link. */
  ctaHref?: string;
  ctaLabel?: string;
  status: Truth;
  statusNote?: string;
};

const CARDS: HubCard[] = [
  {
    title: "Pedidos (inbox)",
    purpose: "Bandeja de órdenes self-serve: buscar, filtrar, marcar leído y abrir detalle.",
    routeLabel: "/admin/tienda/orders",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Abrir pedidos →",
    status: "TRUE",
  },
  {
    title: "Detalle de pedido",
    purpose: "Ficha por UUID: estado operativo, notas internas, archivos del cliente (si aplica).",
    routeLabel: "/admin/tienda/orders/[id]",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Ir a lista de pedidos →",
    status: "TRUE",
    statusNote: "Elige una fila en la bandeja; no hay índice aparte del listado.",
  },
  {
    title: "Catálogo",
    purpose: "Listado de artículos Tienda: visibilidad, destacados, enlaces a edición.",
    routeLabel: "/admin/tienda/catalog",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Abrir catálogo →",
    status: "TRUE",
  },
  {
    title: "Nuevo artículo",
    purpose: "Alta de un ítem en el catálogo (mismo modelo de datos que la edición).",
    routeLabel: "/admin/tienda/catalog/new",
    ctaHref: "/admin/tienda/catalog/new",
    ctaLabel: "Nuevo artículo →",
    status: "TRUE",
  },
  {
    title: "Artículos / productos",
    purpose: "CRUD por ítem vive en el catálogo; no existe una ruta separada solo «productos».",
    routeLabel: "/admin/tienda/catalog y /admin/tienda/catalog/[id]",
    ctaHref: "/admin/tienda/catalog",
    ctaLabel: "Abrir catálogo →",
    status: "PARTIAL",
    statusNote: "Edición por UUID bajo el catálogo.",
  },
  {
    title: "Inventario (SKU / stock)",
    purpose: "Panel dedicado solo a inventario agregado.",
    routeLabel: "(no existe en repo)",
    status: "MISSING",
    statusNote: "No hay ruta `/admin/tienda/inventory` en este repo.",
  },
  {
    title: "Fulfillment y estados",
    purpose: "Transiciones y preparación se gestionan en la bandeja y en cada pedido.",
    routeLabel: "/admin/tienda/orders y detalle",
    ctaHref: "/admin/tienda/orders",
    ctaLabel: "Abrir pedidos →",
    status: "PARTIAL",
    statusNote: "Sin módulo fulfillment aparte.",
  },
  {
    title: "Ajustes solo Tienda",
    purpose: "Página de settings bajo `/admin/tienda/settings`.",
    routeLabel: "(no existe en repo)",
    status: "MISSING",
    statusNote: "Ajustes globales del sitio siguen en otras rutas admin.",
  },
  {
    title: "Mapa workspace Tienda",
    purpose: "Resumen operativo y enlaces (orientación al equipo; no sustituye formularios).",
    routeLabel: "/admin/workspace/tienda",
    ctaHref: "/admin/workspace/tienda",
    ctaLabel: "Abrir mapa →",
    status: "TRUE",
  },
  {
    title: "Editor vitrina (copy e imágenes)",
    purpose: "Hero, categorías y textos de la vitrina pública guardados en `site_section_content`.",
    routeLabel: "/admin/workspace/tienda/storefront",
    ctaHref: "/admin/workspace/tienda/storefront",
    ctaLabel: "Abrir editor →",
    status: "TRUE",
  },
];

function statusClass(s: Truth): string {
  switch (s) {
    case "TRUE":
      return "bg-emerald-50 text-emerald-950 ring-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-950 ring-amber-200";
    case "MISSING":
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
    case "HONESTLY_DISABLED":
      return "bg-[#EDE8E0] text-[#4A4744] ring-[#D8D0C4]";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
  }
}

export default function AdminTiendaHubPage() {
  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <AdminPageHeader
        eyebrow="Tienda"
        title="Centro de comando — Tienda"
        subtitle="Punto de entrada único: pedidos, catálogo y enlaces al workspace de vitrina. Las rutas listadas son las que existen hoy en el admin."
        helperText="Estado TRUE = ruta operativa. PARTIAL = cubierto dentro de otra pantalla. MISSING = no implementado en este repo. Sin contadores inventados."
        rightSlot={
          <Link href="/tienda" className={adminBtnSecondary} target="_blank" rel="noreferrer">
            Ver vitrina pública ↗
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.title} className={`${adminCardBase} flex flex-col gap-2 p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-base font-bold text-[#1E1810]">{c.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusClass(c.status)}`}
              >
                {c.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#5C5346]">{c.purpose}</p>
            <p className="font-mono text-[11px] text-[#3D3428]">
              <span className="font-sans font-semibold text-[#7A7164]">Ruta: </span>
              {c.routeLabel}
            </p>
            {c.statusNote ? <p className="text-[11px] text-[#7A7164]">{c.statusNote}</p> : null}
            {c.ctaHref ? (
              <Link href={c.ctaHref} className="mt-1 text-sm font-bold text-[#6B5B2E] underline">
                {c.ctaLabel ?? "Abrir →"}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
