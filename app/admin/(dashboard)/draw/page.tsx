import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminStubBadgeClass, adminCtaChipSecondary } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

/** Legacy route — not linked from admin nav; kept stable so bookmarks do not 404. */
export default function AdminDrawPlaceholderPage() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>Sin función</span>
      </div>
      <AdminPageHeader
        title="Draw"
        subtitle="Esta ruta no es una herramienta de administración. No hay controles ni vista previa aquí."
        helperText="Si llegaste por un enlace antiguo, usa el panel principal o Secciones del sitio."
      />
      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm leading-relaxed text-[#5C5346]">
          Leonix admin vive en <strong className="text-[#1E1810]">Dashboard</strong>,{" "}
          <strong className="text-[#1E1810]">Users</strong>, <strong className="text-[#1E1810]">Customer ops</strong> y{" "}
          <strong className="text-[#1E1810]">Website sections</strong> — no en esta URL.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/admin" className={`${adminCtaChipSecondary} justify-center`}>
            Ir al Dashboard →
          </Link>
          <Link href="/admin/workspace" className={`${adminCtaChipSecondary} justify-center`}>
            Secciones del sitio →
          </Link>
        </div>
      </div>
    </div>
  );
}
