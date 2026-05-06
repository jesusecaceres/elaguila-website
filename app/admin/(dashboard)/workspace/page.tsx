import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../../_components/adminTheme";
import {
  WEBSITE_EDITING_TRUTH_ROWS,
  type WebsiteEditingTruthStatus,
} from "../../_lib/websiteEditingTruthMatrix";

function websiteEditingStatusClass(s: WebsiteEditingTruthStatus): string {
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

const CARDS = [
  {
    href: "/admin/workspace/home",
    title: "Home",
    body: "Portada pública `/home`: hero, avisos, chips manuales y módulos visibles (no la pantalla raíz `/`). Persistido en `home_marketing`.",
    teach: "Empieza aquí si solo cambias la primera impresión de la entrada a la revista.",
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
  {
    href: "/admin/site-settings",
    title: "Ajustes globales del sitio",
    body: "Avisos transversales, toggles de banners y módulos que cruzan varias rutas. No sustituye editores por sección.",
    teach: "Cuando un cambio afecta nav o varias páginas, vive aquí — no en cada workspace.",
  },
  {
    href: "/admin/workspace/noticias",
    title: "Noticias",
    body: "Dueño de `/noticias`: titular, subtítulo y etiqueta “última hora” en `noticias_page`. El feed RSS sigue siendo API + plantilla.",
    teach: "Editor en /workspace/noticias/content — no es CMS de artículos todavía.",
  },
  {
    href: "/admin/workspace/iglesias",
    title: "Iglesias",
    body: "Landing `/iglesias`: copy transicional en `iglesias_page` hasta directorio con filas en base.",
    teach: "Editor en /workspace/iglesias/content.",
  },
  {
    href: "/admin/workspace/cupones",
    title: "Cupones",
    body: "Rutas `/cupones` y `/coupons` comparten `cupones_page` (título, intro, tarjetas bilingües).",
    teach: "Editor en /workspace/cupones/content.",
  },
  {
    href: "/admin/workspace/anunciate",
    title: "Anúnciate",
    body: "[Solo lectura] Mapa al funnel publicar (Clasificados) y enlaces a cola admin.",
    teach: "No es CRM; operación real en Clasificados + auth.",
  },
] as const;

export default function AdminWorkspaceHubPage() {
  return (
    <div>
      <AdminPageHeader
        title="Secciones del sitio (workspaces)"
        subtitle="Elige una sección para trabajar. La barra lateral izquierda es solo administración global (usuarios, pagos, etc.); este menú no copia el menú público. Arriba de todo: matriz honesta de qué se puede editar hoy en el sitio público."
        eyebrow="Workspace"
      />

      <div className={`${adminCardBase} mb-6 overflow-hidden p-0`}>
        <div className="border-b border-[#E8DFD0]/90 bg-[#FFFCF7] px-4 py-3 sm:px-5">
          <h2 className="text-base font-bold text-[#1E1810]">Matriz — edición del sitio web (verdad operativa)</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
            TRUE = flujo de edición real. PARTIAL = algo existe pero no cubre toda el área. MISSING = sin ruta/workflow en este repo.
            HONESTLY_DISABLED = bloqueado a propósito (p. ej. pie en código). Solo hay enlace «Abrir» cuando la ruta existe; no inventamos editores.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/80 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                <th className="p-3 sm:p-4">Área</th>
                <th className="p-3 sm:p-4">Propósito</th>
                <th className="p-3 sm:p-4">Ruta admin / patrón</th>
                <th className="p-3 sm:p-4">Estado</th>
                <th className="p-3 sm:p-4">Notas</th>
                <th className="p-3 sm:p-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {WEBSITE_EDITING_TRUTH_ROWS.map((row) => (
                <tr key={row.area} className="border-b border-[#F0EBE3] align-top text-[#5C5346] last:border-b-0">
                  <td className="p-3 font-semibold text-[#1E1810] sm:p-4">{row.area}</td>
                  <td className="p-3 text-xs leading-relaxed sm:p-4">{row.purpose}</td>
                  <td className="p-3 font-mono text-[11px] text-[#3D3428] sm:p-4">{row.routeLabel}</td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${websiteEditingStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs leading-relaxed text-[#5C5346] sm:p-4">{row.notes}</td>
                  <td className="p-3 sm:p-4">
                    {row.ctaHref ? (
                      <Link href={row.ctaHref} className="text-xs font-bold text-[#6B5B2E] underline">
                        {row.ctaLabel ?? "Abrir →"}
                      </Link>
                    ) : (
                      <span className="text-xs text-[#9A9084]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4 text-sm text-[#5C5346] sm:p-5">
        <p className="text-base font-bold text-[#1E1810]">Módulos que cruzan varias páginas</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">
          Interruptores o listas que afectan más de una ruta viven en ajustes globales. Para soporte y trazabilidad entre cuenta,
          anuncio y pedido Tienda, usa la búsqueda unificada de ops.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href="/admin/site-settings"
            className={`${adminCtaChip} w-full justify-center sm:w-auto`}
            title="Módulos y conmutadores transversales"
          >
            Ajustes globales del sitio →
          </Link>
          <Link href="/admin/ops" className={`${adminCtaChip} w-full justify-center sm:w-auto`}>
            Customer ops search →
          </Link>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <span className={`${adminCtaChipSecondary} mt-4 w-full justify-center sm:w-fit`}>Abrir workspace →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
