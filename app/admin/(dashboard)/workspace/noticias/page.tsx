import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceNoticiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Sin editor persistido</span>
        <span className={adminStubBadgeClass}>Sin fila site_section_content</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Noticias"
        title="Noticias"
        subtitle="Dueño de producto para `/noticias`. El sitio público ya existe; falta decidir modelo editorial y cablearlo sin mentir en formularios."
        helperText="Recomendación: nueva clave `site_section_content` (p. ej. noticias_hub) o tabla dedicada si necesitas muchos artículos con relaciones. Hasta entonces, este workspace documenta el mapa."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Noticias"
        publicPath="/noticias"
        sourceOfTruth="Repositorio / página Next.js hasta que exista CMS o contenido en Supabase."
        siteSectionKey={null}
        adminEditors={[
          { label: "Home — contenido (chips / enlaces manuales)", href: "/admin/workspace/home/content" },
          { label: "Ajustes globales del sitio", href: "/admin/site-settings" },
          { label: "Customer ops (buscar cuenta o listing)", href: "/admin/ops" },
        ]}
        notYet={[
          "Definir si las noticias viven como markdown en git, JSON en Storage, o filas en Postgres.",
          "Agregar clave tipada en `sectionKeys.ts` + migración antes de cualquier formulario que guarde.",
          "Wire RSS, autoría, o integración externa según producto.",
        ]}
      />

      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/noticias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer" title="Vista pública">
            Abrir /noticias en el sitio
          </Link>
        </p>
        <p className="mt-3 text-xs text-[#7A7164]">
          Cuando exista persistencia, el formulario principal aparecerá en este workspace o en un sub-ruta `/admin/workspace/noticias/content` siguiendo el patrón Home/Nosotros.
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
