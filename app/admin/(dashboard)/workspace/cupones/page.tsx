import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceCuponesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Tarjetas persistidas
        </span>
        <span className={adminPartialBadgeClass}>Sin cupos / escaneos aún</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="Cupones"
        subtitle="Un solo payload (`cupones_page`) alimenta `/cupones` y `/coupons` con copy bilingüe y hasta 8 tarjetas. No hay redención, QR ni límites por usuario todavía."
        helperText="Imágenes deben existir bajo /public (p. ej. /coupons/…)."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Cupones"
        publicPath="/cupones · /coupons"
        sourceOfTruth="Marketing de cupones: `site_section_content.cupones_page`. Sin tabla transaccional todavía."
        siteSectionKey="cupones_page"
        adminEditors={[
          { label: "Editor de página y tarjetas", href: "/admin/workspace/cupones/content" },
          { label: "Tienda — vitrina", href: "/admin/workspace/tienda/storefront" },
          { label: "Home — contenido", href: "/admin/workspace/home/content" },
          { label: "Ajustes globales", href: "/admin/site-settings" },
        ]}
        notYet={[
          "Tabla `coupons` con caducidad real, cupos, códigos y auditoría si el negocio lo exige.",
          "Flujo de canje o integración con POS.",
          "Esquema mínimo viable: código único, max_redemptions, valid_from/until, revocación y tabla `coupon_redemptions` (user_id opcional, timestamp).",
        ]}
      />

      <div className={`${adminCardBase} space-y-3 p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/cupones" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /cupones
          </Link>
          {" · "}
          <Link href="/coupons" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /coupons
          </Link>
        </p>
        <p className="text-xs text-[#7A7164]">
          <Link href="/admin/workspace/cupones/content" className="font-bold text-[#6B5B2E] underline">
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
