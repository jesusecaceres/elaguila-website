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
    canIEditWholeWebsite: "Can I edit the whole website from here?",
    canIEditExplanation: "This admin is currently a structured CMS, not a Wix-style drag/drop builder. Fully editable means admin has a real save workflow for that area. Partly editable means some content can be changed, but layout or new sections still need code. Not built yet means there is no complete admin editor for that area. Locked on purpose means that area is intentionally not editable from admin.",
    smokeTestTitle: "Website editing status",
    smokeTestExplanation: "This shows what you can edit today and what still needs development work.",
    area: "Area",
    purpose: "Purpose",
    adminRoutePattern: "Admin route / pattern",
    status: "Status",
    notes: "Developer notes",
    action: "Action",
    open: "Open →",
    whatThisControls: "What this controls",
    whatYouCanEditToday: "What you can edit today",
    whatStillRequiresCode: "Still requires code",
    primaryAdminAction: "Primary admin action",
    publicPreview: "Public preview",
    addNewLineBlock: "Add new content?",
    useExistingFields: "Use existing fields. New content types need development.",
    useRepeatableItems: "Use the items list to add/reorder/remove content.",
    notEditableYet: "Not editable from admin yet. Requires development.",
    howAddingContentWorks: "How adding content works here",
    contentExplanation: "This admin is currently structured CMS, not freeform drag/drop. Existing fields can be edited immediately. New content requires either: 1) a field added to existing editor, 2) a repeatable content list, or 3) a future page-builder/block-builder module.",
    recommendedNextBuild: "Recommended next build: reusable page block editor",
    blockEditorExplanation: "This would let you add/reorder/remove controlled content blocks like text sections, image sections, CTA buttons, card groups, and announcement strips.",
    planBlockEditor: "Plan block editor",
    modulesCrossingPages: "Modules that affect multiple pages",
    modulesExplanation: "Settings that affect more than one page live in global settings. For customer support and tracking between accounts, ads, and Tienda orders, use the unified Customer ops search.",
    globalSiteSettings: "Global site settings →",
    customerOpsSearch: "Customer ops search →",
    summaryCounts: "Summary",
    needsBuild: "Needs work",
    fullyEditable: "Fully editable",
    partlyEditable: "Partly editable", 
    notBuiltYet: "Not built yet",
    lockedOnPurpose: "Locked on purpose",
    openWorkspace: "Open workspace →",
    validationWarnings: "Status warnings",
    validationErrors: "Status errors",
    filterAll: "All",
    filterFullyEditable: "Fully editable",
    filterPartlyEditable: "Partly editable",
    filterNotBuilt: "Not built yet",
    filterLocked: "Locked",
    whatHappensWhenIClick: "What happens when I click this?",
    editingAdminContent: "You'll edit admin content that appears on the public website.",
    previewingPublicWebsite: "You'll see how this looks on the public website.",
    safeToChange: "Safe to change - this is the admin editor.",
  },
  es: {
    pageTitle: "Espacio de trabajo del sitio web",
    pageSubtitle: "Espacio de trabajo admin para gestionar contenido del sitio. Todavía no es un constructor de arrastrar/soltar estilo Wix.",
    eyebrow: "Workspace",
    backToAdmin: "← Volver a admin",
    canIEditWholeWebsite: "¿Puedo editar todo el sitio web desde aquí?",
    canIEditExplanation: "Este admin es actualmente CMS estructurado, no arrastrar/soltar libre. Totalmente editable significa que admin tiene un flujo de guardado real para esa área. Parcialmente editable significa que algo de contenido se puede cambiar, pero el diseño o nuevas secciones aún necesitan código. No construido aún significa que no hay editor admin completo para esa área. Bloqueado a propósito significa que esa área intencionalmente no es editable desde admin.",
    smokeTestTitle: "Estado de edición del sitio",
    smokeTestExplanation: "Esto muestra lo que puedes editar hoy y qué aún necesita trabajo de desarrollo.",
    area: "Área",
    purpose: "Propósito",
    adminRoutePattern: "Ruta admin / patrón",
    status: "Estado",
    notes: "Notas de desarrollador",
    action: "Acción",
    open: "Abrir →",
    whatThisControls: "Qué controla esto",
    whatYouCanEditToday: "Qué puedes editar hoy",
    whatStillRequiresCode: "Aún requiere código",
    primaryAdminAction: "Acción admin principal",
    publicPreview: "Vista previa pública",
    addNewLineBlock: "¿Agregar nuevo contenido?",
    useExistingFields: "Usa los campos existentes. Nuevos tipos de contenido necesitan desarrollo.",
    useRepeatableItems: "Usa la lista de elementos para agregar/reordenar/eliminar contenido.",
    notEditableYet: "Aún no editable desde admin. Requiere desarrollo.",
    howAddingContentWorks: "Cómo funciona agregar contenido aquí",
    contentExplanation: "Este admin es actualmente CMS estructurado, no arrastrar/soltar libre. Los campos existentes se pueden editar inmediatamente. Nuevo contenido requiere: 1) un campo agregado al editor existente, 2) una lista de contenido repetible, o 3) un futuro módulo constructor de páginas/bloques.",
    recommendedNextBuild: "Próxima construcción recomendada: editor de bloques de página reutilizables",
    blockEditorExplanation: "Esto te permitiría agregar/reordenar/eliminar bloques de contenido controlados como secciones de texto, secciones de imagen, botones CTA, grupos de tarjetas y tiras de anuncios.",
    planBlockEditor: "Planificar editor de bloques",
    modulesCrossingPages: "Módulos que afectan múltiples páginas",
    modulesExplanation: "Las configuraciones que afectan más de una página viven en ajustes globales. Para soporte al cliente y seguimiento entre cuentas, anuncios y pedidos Tienda, usa la búsqueda unificada de operaciones de cliente.",
    globalSiteSettings: "Ajustes globales del sitio →",
    customerOpsSearch: "Búsqueda de operaciones de cliente →",
    summaryCounts: "Resumen",
    needsBuild: "Necesita trabajo",
    fullyEditable: "Totalmente editable",
    partlyEditable: "Parcialmente editable", 
    notBuiltYet: "No construido aún",
    lockedOnPurpose: "Bloqueado a propósito",
    openWorkspace: "Abrir espacio de trabajo →",
    validationWarnings: "Advertencias de estado",
    validationErrors: "Errores de estado",
    filterAll: "Todos",
    filterFullyEditable: "Totalmente editable",
    filterPartlyEditable: "Parcialmente editable",
    filterNotBuilt: "No construido aún",
    filterLocked: "Bloqueado",
    whatHappensWhenIClick: "¿Qué pasa cuando hago clic en esto?",
    editingAdminContent: "Editarás contenido admin que aparece en el sitio web público.",
    previewingPublicWebsite: "Verás cómo se ve esto en el sitio web público.",
    safeToChange: "Seguro para cambiar - este es el editor admin.",
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
  const filterParam = typeof searchParams.filter === "string" ? searchParams.filter : "all";
  const t = getLabels(langParam);

  // Get validation results
  const validation = validateWebsiteEditingMatrix();
  const summary = getWebsiteEditingSummary();

  // Filter rows based on filter
  const filteredRows = WEBSITE_EDITING_TRUTH_ROWS.filter(row => {
    switch (filterParam) {
      case "fully-editable":
        return row.status === "TRUE";
      case "partly-editable":
        return row.status === "PARTIAL";
      case "not-built":
        return row.status === "MISSING";
      case "locked":
        return row.status === "HONESTLY_DISABLED";
      default:
        return true;
    }
  });

  // Helper function to get human-readable status label
  function getStatusLabel(status: WebsiteEditingTruthStatus): string {
    switch (status) {
      case "TRUE":
        return t.fullyEditable;
      case "PARTIAL":
        return t.partlyEditable;
      case "MISSING":
        return t.notBuiltYet;
      case "HONESTLY_DISABLED":
        return t.lockedOnPurpose;
      default:
        return status;
    }
  }

  // Helper function to get owner answer
  function getOwnerAnswer(status: WebsiteEditingTruthStatus): string {
    switch (status) {
      case "TRUE":
        return langParam === "es" ? "Sí — esta área es totalmente editable desde admin." : "Yes — this area is fully editable from admin.";
      case "PARTIAL":
        return langParam === "es" ? "Parcialmente — puedes editar copia/imagenes/configuración, pero nuevas secciones aún requieren código." : "Partly — you can edit copy/images/settings, but new sections still require code.";
      case "MISSING":
        return langParam === "es" ? "No — este editor aún necesita ser construido." : "No — this editor still needs to be built.";
      case "HONESTLY_DISABLED":
        return langParam === "es" ? "Bloqueado — esta área intencionalmente no es editable desde admin." : "Locked — this area is intentionally not editable from admin.";
      default:
        return "";
    }
  }

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

      {/* Filter Tabs */}
      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">Filter by status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/workspace?lang=en"
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterParam === "all" 
                ? "bg-[#C9B46A] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            {t.filterAll}
          </Link>
          <Link
            href="/admin/workspace?lang=en&filter=fully-editable"
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterParam === "fully-editable" 
                ? "bg-emerald-600 text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            {t.filterFullyEditable}
          </Link>
          <Link
            href="/admin/workspace?lang=en&filter=partly-editable"
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterParam === "partly-editable" 
                ? "bg-amber-600 text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            {t.filterPartlyEditable}
          </Link>
          <Link
            href="/admin/workspace?lang=en&filter=not-built"
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterParam === "not-built" 
                ? "bg-[#5C5346] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            {t.filterNotBuilt}
          </Link>
          <Link
            href="/admin/workspace?lang=en&filter=locked"
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterParam === "locked" 
                ? "bg-[#4A4744] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            {t.filterLocked}
          </Link>
        </div>
      </div>

      {/* Owner-Friendly Explanation */}
      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-xl font-bold text-[#1E1810]">{t.canIEditWholeWebsite}</h2>
        <div className="mt-3 rounded-lg border border-[#E8DFD0]/60 bg-[#FFFCF7] p-4">
          <p className="text-sm leading-relaxed text-[#5C5346]">
            {t.canIEditExplanation}
          </p>
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
            <div className="text-xs text-[#7A7164]">{t.partlyEditable}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#5C5346]">{summary.MISSING}</div>
            <div className="text-xs text-[#7A7164]">{t.notBuiltYet}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#4A4744]">{summary.HONESTLY_DISABLED}</div>
            <div className="text-xs text-[#7A7164]">{t.lockedOnPurpose}</div>
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
              {filteredRows.map((row) => (
                <tr key={row.area} className="border-b border-[#F0EBE3] align-top text-[#5C5346] last:border-b-0">
                  <td className="p-3 font-semibold text-lg text-[#1E1810] sm:p-4">{row.area}</td>
                  <td className="p-3 text-sm leading-relaxed sm:p-4">{row.purpose}</td>
                  <td className="p-3 font-mono text-xs text-[#3D3428] sm:p-4">{row.routeLabel}</td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium tracking-wide ring-1 ${websiteEditingStatusClass(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="p-3 text-xs leading-relaxed text-[#5C5346] sm:p-4">
                    <div className="font-medium text-[#1E1810] mb-1">{getOwnerAnswer(row.status)}</div>
                    <div className="text-xs text-[#7A7164]">{t.notes}: {row.notes}</div>
                  </td>
                  <td className="p-3 sm:p-4">
                    {row.ctaHref ? (
                      <div>
                        <Link href={row.ctaHref} className="text-xs font-bold text-[#6B5B2E] underline mb-1 block">
                          {row.ctaLabel ?? t.open}
                        </Link>
                        <div className="text-xs text-[#7A7164]">{t.whatHappensWhenIClick}</div>
                        <div className="text-xs text-[#7A7164]">{t.editingAdminContent}</div>
                        <div className="text-xs text-[#7A7164]">{t.safeToChange}</div>
                      </div>
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
          {filteredRows.map((row) => (
            <div key={row.area} className="border border-[#E8DFD0]/60 rounded-xl p-4 bg-white/80">
              <h3 className="text-lg font-semibold text-[#1E1810] mb-2">{row.area}</h3>
              
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm font-medium text-emerald-900">{getOwnerAnswer(row.status)}</p>
              </div>
              
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

      {/* Recommended Next Build */}
      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-xl font-bold text-[#1E1810]">{t.recommendedNextBuild}</h2>
        <div className="mt-3 rounded-lg border border-[#E8DFD0]/60 bg-[#FFFCF7] p-4">
          <p className="text-sm leading-relaxed text-[#5C5346] mb-3">
            {t.blockEditorExplanation}
          </p>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-900 mb-2">
              This would let you add/reorder/remove:
            </p>
            <ul className="text-sm text-emerald-800 space-y-1 ml-4">
              <li>• Text sections</li>
              <li>• Image sections</li>
              <li>• CTA buttons</li>
              <li>• Card groups</li>
              <li>• Announcement strips</li>
            </ul>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/workspace?focus=block-editor"
              className={`${adminCtaChip} text-sm`}
            >
              {t.planBlockEditor}
            </Link>
          </div>
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
