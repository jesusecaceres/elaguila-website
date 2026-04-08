import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceNoticiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Próximamente</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Noticias"
        title="Noticias"
        subtitle="Página pública `/noticias`. Aún no hay CMS ni fila en site_section_content para esta sección."
        helperText="Este workspace existe para dueños de producto: cuando haya modelo de datos, el formulario vivirá aquí. Por ahora solo enlaces y contexto."
      />
      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/noticias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer" title="Vista pública">
            Abrir /noticias en el sitio
          </Link>
        </p>
        <p className="mt-3 text-xs text-[#7A7164]">
          Coordinación: enlaces destacados en Home (`/admin/workspace/home/content`) o menú público siguen en código hasta que exista editor.
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
