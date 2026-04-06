import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary, adminInputClass } from "../../../_components/adminTheme";
import { getWebsiteContentScaffold } from "../../../_lib/websiteContentScaffold";

export const dynamic = "force-dynamic";

/**
 * Homepage-focused controls. Sitewide module registry / cross-section toggles: `/admin/site-settings`.
 */
export default function AdminWorkspaceHomePage() {
  const modules = getWebsiteContentScaffold().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <AdminPageHeader
        title="Home — portada principal"
        subtitle="Lo que ves en `/` (hero, anuncios, destacados de clasificados en home, etc.). Los interruptores que afectan a todo el sitio viven en Ajustes globales del sitio."
        eyebrow="Workspace · Home"
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Tip para el equipo:</strong> edita aquí la narrativa de la portada. Para el registro de módulos que puede tocar varias rutas, abre{" "}
          <Link href="/admin/site-settings" className="font-bold underline">
            Ajustes globales del sitio (módulos)
          </Link>
          .
        </p>
      </div>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Hero y anuncios (esqueleto)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Persistencia futura (Supabase o JSON). Estos campos enseñan qué controlará esta pantalla.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Titular hero (ES)</label>
            <input className={adminInputClass} disabled placeholder="Texto principal de la portada" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Subtítulo / soporte</label>
            <input className={adminInputClass} disabled placeholder="Línea de apoyo bajo el hero" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#5C5346]">Anuncio breve (franja superior)</label>
            <input className={adminInputClass} disabled placeholder="Ej.: horario festivo, mantenimiento" />
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#7A7164]">Módulos de la home (referencia)</h2>
      <div className="grid gap-4">
        {modules.map((m) => (
          <div key={m.id} className={`${adminCardBase} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#7A7164]">Orden {m.sortOrder}</p>
                <h3 className="text-lg font-bold text-[#1E1810]">{m.label}</h3>
                <p className="mt-1 max-w-2xl text-sm text-[#5C5346]/95">{m.description}</p>
                {m.notes ? <p className="mt-2 text-xs text-[#A67C52]">{m.notes}</p> : null}
              </div>
              <span className="rounded-full bg-[#FBF7EF] px-3 py-1 text-xs font-bold uppercase text-[#5C4E2E]">{m.visibility}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Notas internas</label>
                <input className={adminInputClass} disabled placeholder="Qué controla en la home" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Prioridad en página</label>
                <input className={adminInputClass} disabled placeholder="1–100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/admin/site-settings" className={`${adminBtnSecondary} inline-flex`}>
          Abrir ajustes globales (módulos del sitio) →
        </Link>
      </div>
    </div>
  );
}
