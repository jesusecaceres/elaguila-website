import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminReadOnlyBadgeClass, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceAnunciatePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminReadOnlyBadgeClass}>Solo lectura</span>
        <span className={adminStubBadgeClass}>Sin CRM</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Anúnciate"
        title="Anúnciate / publicar"
        subtitle="El menú público “Anúnciate” envía al flujo de login y publicación (p. ej. En venta). No hay formulario guardado aquí: la operación vive en Clasificados + auth."
        helperText="Usa esta página como mapa: enlaces rápidos al hub público y a la cola admin de anuncios. Leads/CRM no están modelados."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Anúnciate / publicar"
        publicPath="/clasificados/publicar (+ ramas)"
        sourceOfTruth="Auth + tablas `listings` (Clasificados) y flujos específicos por vertical — no hay entidad “anunciate_page” en BD."
        siteSectionKey={null}
        adminEditors={[
          { label: "Clasificados workspace (cola y moderación)", href: "/admin/workspace/clasificados" },
          { label: "Customer ops (dueño, email, listing id)", href: "/admin/ops" },
          { label: "Categorías — conteos y enlaces a cola", href: "/admin/categories" },
          { label: "Reportes", href: "/admin/reportes" },
        ]}
        notYet={[
          "CRM / pipeline de leads si producto lo requiere.",
          "Unificar métricas de embudo publicar → listing activo.",
        ]}
      />

      <div className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Flujo público</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-[#5C5346]">
          <li>
            <Link
              href="/clasificados/publicar"
              className="font-bold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
              title="Hub de publicación en Clasificados"
            >
              /clasificados/publicar
            </Link>
          </li>
          <li>
            <Link
              href="/clasificados/publicar/en-venta"
              className="font-bold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
            >
              /clasificados/publicar/en-venta
            </Link>
          </li>
          <li>
            <Link href="/publicar/autos" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
              /publicar/autos
            </Link>{" "}
            (y ramas negocio/privado)
          </li>
        </ul>
      </div>

      <div className={`${adminCardBase} space-y-3 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Operación admin</h2>
        <p className="text-xs text-[#7A7164]">Moderación y anuncios en base:</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/workspace/clasificados"
            className="rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
            title="Cola Supabase de listings"
          >
            Workspace Clasificados
          </Link>
          <Link href="/admin/categories" className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
            Categorías
          </Link>
          <Link href="/admin/reportes" className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
            Reportes
          </Link>
        </div>
      </div>

      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
