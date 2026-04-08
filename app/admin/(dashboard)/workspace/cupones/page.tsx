import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceCuponesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Sin editor persistido</span>
        <span className={adminStubBadgeClass}>API legacy /pages</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="Cupones"
        subtitle="Rutas `/cupones` y `/coupons` sirven contenido hoy; el admin aún no controla ofertas ni caducidad sin trabajo de datos."
        helperText="Patrones probados en Leonix: `site_section_content` para copy/hero, o tabla `coupons` si necesitas estados, cupos y auditoría. Este workspace documenta el vacío hasta elegir."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Cupones"
        publicPath="/cupones · /coupons"
        sourceOfTruth="Páginas públicas + API en `pages/api` (legacy) hasta consolidar en App Router / Supabase."
        siteSectionKey={null}
        adminEditors={[
          { label: "Tienda — vitrina (copy comercial relacionado)", href: "/admin/workspace/tienda/storefront" },
          { label: "Home — contenido", href: "/admin/workspace/home/content" },
          { label: "Ajustes globales", href: "/admin/site-settings" },
        ]}
        notYet={[
          "Inventariar fuente real de cupones (estático vs API vs DB).",
          "Si hay DB, exponer CRUD admin y retirar duplicados engañosos.",
          "Opcional: clave `site_section_content` solo para textos legales / disclaimers.",
        ]}
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
