import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceCuponesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Próximamente</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="Cupones"
        subtitle="Rutas públicas `/cupones` y `/coupons`. No hay editor admin ni tabla dedicada en este paso."
        helperText="El menú público enlaza cupones; este workspace marca dueño interno hasta que exista persistencia (p. ej. site_section_content o tabla de ofertas)."
      />
      <div className={`${adminCardBase} space-y-3 p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/cupones?lang=es" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /cupones
          </Link>
          {" · "}
          <Link href="/coupons?lang=en" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /coupons
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
