import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceNoticiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Shell persistido
        </span>
        <span className={adminPartialBadgeClass}>Feed RSS · no CMS</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Noticias"
        title="Noticias"
        subtitle="Dueño de `/noticias`. El marco (título, subtítulo, etiqueta de última hora) se guarda en Supabase; los artículos siguen viniendo del API RSS y categorías de la plantilla."
        helperText="Para chips que enlazan a esta sección desde la portada, usa Home → contenido."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Noticias"
        publicPath="/noticias"
        sourceOfTruth="Shell: `site_section_content.noticias_page`. Contenido dinámico: `/api/rss` + plantilla React (categorías y tarjetas)."
        siteSectionKey="noticias_page"
        adminEditors={[
          { label: "Editor shell (título / subtítulo / última hora)", href: "/admin/workspace/noticias/content" },
          { label: "Home — contenido (chips / enlaces manuales)", href: "/admin/workspace/home/content" },
          { label: "Ajustes globales del sitio", href: "/admin/site-settings" },
          { label: "Customer ops", href: "/admin/ops" },
        ]}
        notYet={[
          "Modelo editorial completo: artículos propios en Postgres, markdown en git, o integración externa.",
          "Edición de taxonomía de pestañas (Últimas, Deportes…) sin deploy.",
          "Siguiente paso mínimo viable: tabla `news_articles` + campos slug/body/published_at + lectura en `/noticias` con fallback RSS.",
        ]}
      />

      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/noticias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer" title="Vista pública">
            Abrir /noticias en el sitio
          </Link>
        </p>
        <p className="mt-3 text-xs text-[#7A7164]">
          <Link href="/admin/workspace/noticias/content" className="font-bold text-[#6B5B2E] underline">
            Ir al editor de shell →
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Volver al mapa de secciones">
        ← Resumen de workspaces
      </Link>
    </div>
  );
}
