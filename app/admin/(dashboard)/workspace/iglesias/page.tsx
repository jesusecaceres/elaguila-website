import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceIglesiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Próximamente</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Página pública `/iglesias`. Sin panel de contenido en base todavía."
        helperText="Cuando definas fuente de verdad (JSON, Supabase o CMS), conectar aquí. Por ahora solo referencia operativa."
      />
      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/iglesias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer" title="Vista pública">
            Abrir /iglesias en el sitio
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
