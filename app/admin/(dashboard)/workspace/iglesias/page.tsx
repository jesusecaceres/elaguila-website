import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceIglesiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Copy persistido
        </span>
        <span className={adminStubBadgeClass}>Directorio · backlog</span>
        <span className={adminPartialBadgeClass}>Sin filas de iglesia aún</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Landing pública `/iglesias` con mensaje transicional editable. Cuando exista directorio, las fichas vendrán de base de datos + migraciones."
        helperText="Contacto público para altas tempranas sigue en la página Contacto del sitio."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Iglesias"
        publicPath="/iglesias"
        sourceOfTruth="Copy transicional: `site_section_content.iglesias_page`. Directorio: aún no modelado en Postgres."
        siteSectionKey="iglesias_page"
        adminEditors={[
          { label: "Editor de copy", href: "/admin/workspace/iglesias/content" },
          { label: "Contacto (datos de soporte públicos)", href: "/admin/workspace/contacto/content" },
          { label: "Customer ops", href: "/admin/ops" },
        ]}
        notYet={[
          "Tabla de congregaciones, geodata, moderación y flujo de altas.",
          "Búsqueda y filtros en admin enlazados a perfiles o cuentas.",
        ]}
      />

      <div className={`${adminCardBase} p-6`}>
        <Link href="/iglesias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          Abrir /iglesias
        </Link>
        <p className="mt-3 text-xs text-[#7A7164]">
          <Link href="/admin/workspace/iglesias/content" className="font-bold text-[#6B5B2E] underline">
            Ir al editor →
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
