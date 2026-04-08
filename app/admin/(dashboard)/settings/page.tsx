import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminInputClass, adminStubBadgeClass } from "../../_components/adminTheme";
import { SITE_THEME_PRESETS, type SiteThemePresetId } from "../../_lib/adminSettingsTheme";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        title="Settings"
        subtitle="Environment and future theme control. Changing presets does not alter the public site until CSS variable wiring lands."
        helperText="Tema y campos deshabilitados: no se guardan. Para avisos globales del sitio usa Ajustes globales (/admin/site-settings)."
      />

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Environment</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Structural changes still require deploys. This panel surfaces safe, non-secret configuration intent only.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#5C5346]/95">
          <li>Verify production Supabase URL + anon key via deployment dashboard (not shown here).</li>
          <li>Service role key must never ship to the browser — admin data uses server-only `getAdminSupabase`.</li>
        </ul>
      </div>

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Active site theme (staged)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Maps to future <code className="rounded bg-white/80 px-1">data-site-theme</code> + CSS variables. Selection is not
          persisted.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SITE_THEME_PRESETS.map((p) => (
            <label
              key={p.id}
              className="flex cursor-not-allowed gap-3 rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-4 opacity-80"
            >
              <input type="radio" name="theme" disabled defaultChecked={p.id === ("default" as SiteThemePresetId)} />
              <span>
                <span className="block font-semibold text-[#1E1810]">{p.label}</span>
                <span className="text-xs text-[#7A7164]">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Seasonal mode label</label>
            <input className={adminInputClass} disabled placeholder="e.g. Spring promo 2026" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Content configuration notes</label>
            <input className={adminInputClass} disabled placeholder="Internal coordination notes" />
          </div>
        </div>
        <button type="button" disabled className={`${adminBtnPrimary} mt-4 opacity-60`}>
          Save theme preference (not wired)
        </button>
      </div>
    </div>
  );
}
