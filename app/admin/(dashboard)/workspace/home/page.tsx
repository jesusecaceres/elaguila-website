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
        subtitle="La ruta pública es `/home` (entrada a la revista). La pantalla `/` es otra experiencia (selector de idioma) y no se edita aquí. Los avisos bajo el menú de todo el sitio están en Ajustes globales."
        eyebrow="Workspace · Home"
        helperText="Edita textos e imagen en Contenido. Los chips de enlaces son manuales (no sincronizan solos con Clasificados)."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Contenido persistente:</strong>{" "}
          <Link href="/admin/workspace/home/content" className="font-bold underline">
            Abrir editor de la portada `/home`
          </Link>{" "}
          (textos bilingües e imagen). Para interruptores que afectan varias rutas, usa{" "}
          <Link href="/admin/site-settings" className="font-bold underline">
            Ajustes globales del sitio
          </Link>
          .
        </p>
      </div>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Resumen</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          La clave <span className="font-mono text-[11px]">home_marketing</span> en la base alimenta la ruta{" "}
          <span className="font-mono text-[11px]">/home</span>. La tabla de módulos abajo es referencia interna (no escribe en BD); avisos globales bajo el menú: Ajustes globales del sitio.
        </p>
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
