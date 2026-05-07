import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../../_components/adminTheme";
import {
  WEBSITE_EDITING_TRUTH_ROWS,
  getWebsiteEditingSummary,
  validateWebsiteEditingMatrix,
  getSmokeTestStatusMessage,
  type WebsiteEditingTruthStatus,
} from "../../_lib/websiteEditingTruthMatrix";

// Language-aware labels
const labels = {
  en: {
    pageTitle: "Website Editing Workspace",
    pageSubtitle: "Admin workspace for managing website content. Not a Wix-style drag/drop builder yet.",
    eyebrow: "Workspace",
    backToAdmin: "← Back to admin",
    smokeTestTitle: "Website editing smoke test",
    smokeTestExplanation: "This is not a Wix-style drag/drop builder yet. TRUE means editable from admin today. PARTIAL means some content is editable but template/layout may still live in code.",
    area: "Area",
    purpose: "Purpose",
    adminRoutePattern: "Admin route / pattern",
    status: "Status",
    notes: "Notes",
    action: "Action",
    open: "Open →",
    whatThisControls: "What this controls",
    whatYouCanEditToday: "What you can edit today",
    whatStillRequiresCode: "What still requires code",
    primaryAdminAction: "Primary admin action",
    publicPreview: "Public preview",
    addNewLineBlock: "Add new line/block?",
    useExistingFields: "Use existing fields. New block types require a new schema field or block editor.",
    useRepeatableItems: "Use the repeatable items list to add/reorder/remove content.",
    notEditableYet: "Not editable from admin yet. Requires development.",
    howAddingContentWorks: "How adding content works here",
    contentExplanation: "This admin is currently structured CMS, not freeform drag/drop. Existing fields can be edited immediately. New lines/sections require either: 1) a field added to existing editor, 2) a repeatable block list, or 3) a future page-builder/block-builder module.",
    recommendedNextBuild: "Recommended next build: \"Reusable page block editor.\"",
    modulesCrossingPages: "Modules that cross multiple pages",
    modulesExplanation: "Switches or lists that affect more than one route live in global settings. For support and traceability between account, ad and Tienda order, use the unified Customer ops search.",
    globalSiteSettings: "Global site settings →",
    customerOpsSearch: "Customer ops search →",
    summaryCounts: "Summary counts",
    needsBuild: "Needs build",
    fullyEditable: "Fully editable",
    partiallyEditable: "Partially editable", 
    missingEditor: "Missing editor",
    honestlyDisabled: "Intentionally disabled",
    openWorkspace: "Open workspace →",
    validationWarnings: "Validation warnings",
    validationErrors: "Validation errors",
  },
  es: {
    pageTitle: "Espacio de trabajo del sitio web",
    pageSubtitle: "Espacio de trabajo admin para gestionar contenido del sitio. Todavía no es un constructor de arrastrar/soltar estilo Wix.",
    eyebrow: "Workspace",
    backToAdmin: "← Volver a admin",
    smokeTestTitle: "Prueba de humo de edición del sitio",
    smokeTestExplanation: "Esto aún no es un constructor de arrastrar/soltar estilo Wix. VERDADERO significa editable desde admin hoy. PARCIAL significa que algo es editable pero la plantilla/diseño puede estar en código.",
    area: "Área",
    purpose: "Propósito",
    adminRoutePattern: "Ruta admin / patrón",
    status: "Estado",
    notes: "Notas",
    action: "Acción",
    open: "Abrir →",
    whatThisControls: "Qué controla esto",
    whatYouCanEditToday: "Qué puedes editar hoy",
    whatStillRequiresCode: "Qué aún requiere código",
    primaryAdminAction: "Acción admin primaria",
    publicPreview: "Vista previa pública",
    addNewLineBlock: "¿Agregar nueva línea/bloque?",
    useExistingFields: "Usa los campos existentes. Nuevos tipos de bloque requieren un nuevo campo de esquema o editor de bloques.",
    useRepeatableItems: "Usa la lista de elementos repetibles para agregar/reordenar/eliminar contenido.",
    notEditableYet: "Aún no editable desde admin. Requiere desarrollo.",
    howAddingContentWorks: "Cómo funciona agregar contenido aquí",
    contentExplanation: "Este admin es actualmente CMS estructurado, no arrastrar/soltar libre. Los campos existentes se pueden editar inmediatamente. Nuevas líneas/secciones requieren: 1) un campo agregado al editor existente, 2) una lista de bloques repetibles, o 3) un futuro módulo constructor de páginas/bloques.",
    recommendedNextBuild: "Próxima construcción recomendada: \"Editor de bloques de página reutilizables.\"",
    modulesCrossingPages: "Módulos que cruzan múltiples páginas",
    modulesExplanation: "Los interruptores o listas que afectan más de una ruta viven en ajustes globales. Para soporte y trazabilidad entre cuenta, anuncio y pedido Tienda, usa la búsqueda unificada de operaciones de cliente.",
    globalSiteSettings: "Ajustes globales del sitio →",
    customerOpsSearch: "Búsqueda de operaciones de cliente →",
    summaryCounts: "Resumen de conteos",
    needsBuild: "Necesita construcción",
    fullyEditable: "Totalmente editable",
    partiallyEditable: "Parcialmente editable", 
    missingEditor: "Editor faltante",
    honestlyDisabled: "Intencionalmente deshabilitado",
    openWorkspace: "Abrir espacio de trabajo →",
    validationWarnings: "Advertencias de validación",
    validationErrors: "Errores de validación",
  },
};

function getLabels(lang: 'en' | 'es' = 'en') {
  return labels[lang];
}

function websiteEditingStatusClass(s: WebsiteEditingTruthStatus): string {
  switch (s) {
    case "TRUE":
      return "bg-emerald-50 text-emerald-950 ring-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-950 ring-amber-200";
    case "MISSING":
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
    case "HONESTLY_DISABLED":
      return "bg-[#EDE8E0] text-[#4A4744] ring-[#D8D0C4]";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-[#E8DFD0]";
  }
}

const WORKSPACE_CARDS = [
  {
    href: "/admin/workspace/home",
    title: "Home",
    body: "Public cover `/home`: hero, notices, manual chips and visible modules (not the root `/` screen). Persisted in `home_marketing`.",
    teach: "Start here if you only change the first impression of the magazine entrance.",
  },
  {
    href: "/admin/workspace/clasificados",
    title: "Clasificados",
    body: "Ad queue, filters, En Venta moderation, category registry and reports.",
    teach: "Daily ad operations — don't confuse with Tienda.",
  },
  {
    href: "/admin/workspace/tienda",
    title: "Tienda",
    body: "Map to orders, real catalog, images, prices and featured items in storefront.",
    teach: "CRUD continues in /admin/tienda/*; this workspace guides the team.",
  },
  {
    href: "/admin/workspace/nosotros",
    title: "Nosotros",
    body: "History, team, media and CTAs from about section.",
    teach: "Brand narrative; links well with Contact.",
  },
  {
    href: "/admin/workspace/revista",
    title: "Revista",
    body: "Featured issue, archive and metadata linked to magazine manifest.",
    teach: "Periodic editorial content, separate from Tienda catalog.",
  },
  {
    href: "/admin/workspace/contacto",
    title: "Contacto",
    body: "Phone, email, hours, map and copy from public form.",
    teach: "Data that visitors see; internal support continues in sidebar.",
  },
  {
    href: "/admin/site-settings",
    title: "Global site settings",
    body: "Cross-site notices, banner toggles and modules that cross several routes. Does not replace editors by section.",
    teach: "When a change affects nav or multiple pages, it lives here — not in each workspace.",
  },
  {
    href: "/admin/workspace/noticias",
    title: "Noticias",
    body: "Owner of `/noticias`: headline, subtitle and \"last hour\" tag in `noticias_page`. RSS feed remains API + template.",
    teach: "Editor at /workspace/noticias/content — not yet article CMS.",
  },
  {
    href: "/admin/workspace/iglesias",
    title: "Iglesias",
    body: "Landing `/iglesias`: transitional copy in `iglesias_page` until directory with rows in database.",
    teach: "Editor at /workspace/iglesias/content.",
  },
  {
    href: "/admin/workspace/cupones",
    title: "Cupones",
    body: "Routes `/cupones` and `/coupons` share `cupones_page` (title, intro, bilingual cards).",
    teach: "Editor at /workspace/cupones/content.",
  },
  {
    href: "/admin/workspace/anunciate",
    title: "Anúnciate",
    body: "[Read only] Map to publish funnel (Clasificados) and links to admin queue.",
    teach: "Not CRM; real operation in Clasificados + auth.",
  },
] as const;

export default async function AdminWorkspaceHubPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  // Get language preference from search params, default to 'en'
  const searchParams = props.searchParams ? await props.searchParams : {};
  const langParam = typeof searchParams.lang === "string" && (searchParams.lang === "es" || searchParams.lang === "en") 
    ? searchParams.lang as "en" | "es" 
    : "en";
  const t = getLabels(langParam);

  // Get validation results
  const validation = validateWebsiteEditingMatrix();
  const summary = getWebsiteEditingSummary();

  return (
    <div>
      <AdminPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        eyebrow={t.eyebrow}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin" className={adminCtaChipSecondary} title={t.backToAdmin}>
          {t.backToAdmin}
        </Link>
        
        {/* Language Toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] p-1">
          <Link
            href="/admin/workspace?lang=en"
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              langParam === "en" 
                ? "bg-[#C9B46A] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            EN
          </Link>
          <Link
            href="/admin/workspace?lang=es"
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              langParam === "es" 
                ? "bg-[#C9B46A] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            ES
          </Link>
        </div>
      </div>

      {/* Summary Counts */}
      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.summaryCounts}</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{summary.TRUE}</div>
            <div className="text-xs text-[#7A7164]">{t.fullyEditable}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{summary.PARTIAL}</div>
            <div className="text-xs text-[#7A7164]">{t.partiallyEditable}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#5C5346]">{summary.MISSING}</div>
            <div className="text-xs text-[#7A7164]">{t.missingEditor}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4A4744]">{summary.HONESTLY_DISABLED}</div>
            <div className="text-xs text-[#7A7164]">{t.honestlyDisabled}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.needsBuild}</div>
            <div className="text-xs text-[#7A7164]">{t.needsBuild}</div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {(validation.warnings.length > 0 || validation.errors.length > 0) && (
        <div className={`${adminCardBase} mb-6 p-5 border-amber-200 bg-amber-50`}>
          <h2 className="text-lg font-bold text-amber-900">
            {validation.errors.length > 0 ? t.validationErrors : t.validationWarnings}
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {validation.errors.map((error, i) => (
              <li key={i} className="text-red-700">• {error}</li>
            ))}
            {validation.warnings.map((warning, i) => (
              <li key={i} className="text-amber-700">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Smoke Test Matrix */}
      <div className={`${adminCardBase} mb-6 overflow-hidden p-0`}>
        <div className="border-b border-[#E8DFD0]/90 bg-[#FFFCF7] px-4 py-3 sm:px-5">
          <h2 className="text-base font-bold text-[#1E1810]">{t.smokeTestTitle}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
            {t.smokeTestExplanation}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/80 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
                <th className="p-3 sm:p-4">{t.area}</th>
                <th className="p-3 sm:p-4">{t.purpose}</th>
                <th className="p-3 sm:p-4">{t.adminRoutePattern}</th>
                <th className="p-3 sm:p-4">{t.status}</th>
                <th className="p-3 sm:p-4">{t.notes}</th>
                <th className="p-3 sm:p-4">{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {WEBSITE_EDITING_TRUTH_ROWS.map((row) => (
                <tr key={row.area} className="border-b border-[#F0EBE3] align-top text-[#5C5346] last:border-b-0">
                  <td className="p-3 font-semibold text-[#1E1810] sm:p-4">{row.area}</td>
                  <td className="p-3 text-xs leading-relaxed sm:p-4">{row.purpose}</td>
                  <td className="p-3 font-mono text-[11px] text-[#3D3428] sm:p-4">{row.routeLabel}</td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${websiteEditingStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs leading-relaxed text-[#5C5346] sm:p-4">{row.notes}</td>
                  <td className="p-3 sm:p-4">
                    {row.ctaHref ? (
                      <Link href={row.ctaHref} className="text-xs font-bold text-[#6B5B2E] underline">
                        {row.ctaLabel ?? t.open}
                      </Link>
                    ) : (
                      <span className="text-xs text-[#9A9084]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Row Guidance */}
      <div className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4 text-sm text-[#5C5346] sm:p-5">
        <p className="text-base font-bold text-[#1E1810]">Detailed guidance for each area</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">
          For each editing area, you can see exactly what's editable today and what still requires development work.
        </p>
        <div className="mt-4 space-y-6">
          {WEBSITE_EDITING_TRUTH_ROWS.map((row) => (
            <div key={row.area} className="border border-[#E8DFD0]/60 rounded-xl p-4 bg-white/80">
              <h3 className="font-semibold text-[#1E1810] mb-2">{row.area}</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[#5C5346] mb-1">{t.whatThisControls}</p>
                  <p className="text-sm text-[#1E1810]">{row.purpose}</p>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-[#5C5346] mb-1">{t.whatYouCanEditToday}</p>
                  <p className="text-sm text-[#1E1810]">
                    {row.editableToday || getSmokeTestStatusMessage(row.status)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-3">
                <div>
                  <p className="text-xs font-medium text-[#5C5346] mb-1">{t.whatStillRequiresCode}</p>
                  <p className="text-sm text-[#5C5346]">
                    {row.requiresCode || (row.status === "TRUE" ? "Nothing" : "Development work needed")}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-[#5C5346] mb-1">{t.addNewLineBlock}</p>
                  <p className="text-sm text-[#5C5346]">
                    {row.addNewGuidance || t.useExistingFields}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.ctaHref && (
                  <Link
                    href={row.ctaHref}
                    className={`${adminCtaChip} text-xs`}
                  >
                    {t.primaryAdminAction}
                  </Link>
                )}
                {row.publicRoute && (
                  <Link
                    href={row.publicRoute}
                    target="_blank"
                    className={`${adminCtaChipSecondary} text-xs`}
                  >
                    {t.publicPreview}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How Content Adding Works */}
      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.howAddingContentWorks}</h2>
        <div className="mt-3 rounded-lg border border-[#E8DFD0]/60 bg-[#FFFCF7] p-4">
          <p className="text-sm leading-relaxed text-[#5C5346]">
            {t.contentExplanation}
          </p>
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-900">
              {t.recommendedNextBuild}
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Page Modules */}
      <div className="mb-6 rounded-2xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-4 text-sm text-[#5C5346] sm:p-5">
        <p className="text-base font-bold text-[#1E1810]">{t.modulesCrossingPages}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">
          {t.modulesExplanation}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href="/admin/site-settings"
            className={`${adminCtaChip} w-full justify-center sm:w-auto`}
            title="Cross-page modules and switches"
          >
            {t.globalSiteSettings}
          </Link>
          <Link href="/admin/ops" className={`${adminCtaChipSecondary} w-full justify-center sm:w-auto`}>
            {t.customerOpsSearch}
          </Link>
        </div>
      </div>

      {/* Workspace Cards */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WORKSPACE_CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`${adminCardBase} block p-5 transition hover:ring-2 hover:ring-[#C9B46A]/30`}
            title={c.teach}
          >
            <h2 className="text-lg font-bold text-[#1E1810]">{c.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{c.body}</p>
            <p className="mt-3 text-xs italic text-[#9A9084]">{c.teach}</p>
            <span className={`${adminCtaChipSecondary} mt-4 w-full justify-center sm:w-fit`}>{t.openWorkspace}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
