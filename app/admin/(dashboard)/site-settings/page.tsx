import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminInputClass } from "../../_components/adminTheme";
import { getWebsiteContentScaffold } from "../../_lib/websiteContentScaffold";

export const dynamic = "force-dynamic";

/**
 * Global site modules / toggles that can affect more than the homepage alone.
 * Homepage-specific blocks (hero, announcements on `/`) belong in **Website sections → Home**.
 */
export default function AdminGlobalSiteSettingsPage() {
  const modules = getWebsiteContentScaffold().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <AdminPageHeader
        title="Ajustes globales del sitio"
        subtitle="Módulos y conmutadores que pueden cruzar varias secciones. La portada principal (hero, anuncios en la home) se edita en Website sections → Home — no aquí."
        eyebrow="Global admin"
      />

      <div className={`${adminCardBase} mb-6 border-[#C9B46A]/40 bg-[#FFFCF7] p-4`}>
        <p className="text-sm font-semibold text-[#1E1810]">¿Dónde edito qué?</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#5C5346]">
          <li>
            <strong>Home (portada):</strong>{" "}
            <Link href="/admin/workspace/home" className="font-bold text-[#6B5B2E] underline">
              Website sections → Home
            </Link>
          </li>
          <li>
            <strong>Clasificados, Tienda, Nosotros, Revista, Contacto:</strong> cada uno tiene su workspace bajo{" "}
            <Link href="/admin/workspace" className="font-bold text-[#6B5B2E] underline">
              Website sections
            </Link>
            .
          </li>
        </ul>
      </div>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Conmutadores globales (esqueleto)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Controles solo visuales hasta exista almacén de configuración (Supabase / JSON versionado).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" defaultChecked />
            Hero visible (global)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" defaultChecked />
            Franja de anuncios
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input type="checkbox" disabled className="h-4 w-4 rounded border-[#E8DFD0]" />
            Promo estacional
          </label>
        </div>
        <button type="button" disabled className={`${adminBtnPrimary} mt-4 opacity-60`}>
          Publicar cambios (sin cablear)
        </button>
      </div>

      <div className="grid gap-4">
        {modules.map((m) => (
          <div key={m.id} className={`${adminCardBase} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#7A7164]">Módulo · orden {m.sortOrder}</p>
                <h3 className="text-lg font-bold text-[#1E1810]">{m.label}</h3>
                <p className="mt-1 max-w-2xl text-sm text-[#5C5346]/95">{m.description}</p>
                {m.notes ? <p className="mt-2 text-xs text-[#A67C52]">{m.notes}</p> : null}
              </div>
              <span className="rounded-full bg-[#FBF7EF] px-3 py-1 text-xs font-bold uppercase text-[#5C4E2E]">
                {m.visibility}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Referencia de titular / copy</label>
                <input className={adminInputClass} disabled placeholder="Clave CMS futura" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C5346]">Prioridad de colocación</label>
                <input className={adminInputClass} disabled placeholder="1–100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
