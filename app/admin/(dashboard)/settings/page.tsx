import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminPagePurposeCard } from "../../_components/AdminPagePurposeCard";
import { adminCardBase, adminBtnPrimary, adminInputClass, adminStubBadgeClass, adminCtaChipSecondary } from "../../_components/adminTheme";
import { SITE_THEME_PRESETS, type SiteThemePresetId } from "../../_lib/adminSettingsTheme";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>{m("settingsPage.stub")}</span>
      </div>
      <AdminPageHeader title="Settings" subtitle={m("settingsPage.subtitle")} helperText={m("settingsPage.helperText")} />
      <AdminPagePurposeCard
        title="Settings"
        purpose="Show safe admin configuration intent without pretending global settings, themes, or environment controls are fully writable."
        dataSource="Code-defined settings copy, staged theme presets, admin access helpers, and links to real workspace/site settings routes."
        status="planned"
        safeActions={["Review environment notes", "Open Site Settings", "Open Website Control"]}
        nextGate="ADMIN-WEBSITE-CONTROL-SCHEMA-01"
        warningNote="Theme preference form is intentionally disabled; no secrets or production env values are displayed."
      />

      <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <strong>{m("settingsPage.blockerLead")}</strong> {m("settingsPage.blockerBody")}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/site-settings" className={`${adminCtaChipSecondary} justify-center text-xs`}>
            {m("settingsPage.linkGlobal")}
          </Link>
          <Link href="/admin/workspace" className={`${adminCtaChipSecondary} justify-center text-xs`}>
            {m("settingsPage.linkWorkspace")}
          </Link>
        </div>
      </div>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Environment</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Structural changes still require deploys. This panel surfaces safe, non-secret configuration intent only.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#5C5346]/95">
          <li>Verify production Supabase URL + anon key via deployment dashboard (not shown here).</li>
          <li>Service role key must never ship to the browser — admin data uses server-only `getAdminSupabase`.</li>
          <li>{m("settingsPage.envRosterLi")}</li>
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
