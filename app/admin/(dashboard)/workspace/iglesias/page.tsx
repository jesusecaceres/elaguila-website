import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceIglesiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Sin editor persistido</span>
        <span className={adminStubBadgeClass}>Sin fila site_section_content</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Sección pública `/iglesias`. Misma situación que Noticias: página viva, backoffice aún por modelar."
        helperText="Idealmente una clave `site_section_content` ligera (listado + textos) o tabla si el directorio crece. No simulamos guardado."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Iglesias"
        publicPath="/iglesias"
        sourceOfTruth="Código / contenido estático del repo hasta migración editorial."
        siteSectionKey={null}
        adminEditors={[
          { label: "Ajustes globales del sitio (banners / cross-site)", href: "/admin/site-settings" },
          { label: "Contacto (datos de soporte públicos)", href: "/admin/workspace/contacto/content" },
        ]}
        notYet={[
          "Añadir clave en `SITE_SECTION_KEYS` + payload tipado si los textos deben ser editables sin deploy.",
          "Si el directorio es data-heavy, valorar tabla `iglesias` con RLS y admin CRUD.",
        ]}
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
