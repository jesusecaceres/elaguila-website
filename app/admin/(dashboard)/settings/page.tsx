import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminInputClass, adminStubBadgeClass, adminCtaChipSecondary } from "../../_components/adminTheme";
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
        subtitle="Esta página sigue siendo intencionalmente no persistente: no hay tabla Leonix de “site settings” genéricos. El tema y notas de coordinación viven en código / despliegue hasta que exista un modelo acordado."
        helperText="Lo que sí persiste hoy: secciones del sitio (`site_section_content`), categorías (`site_category_config`), ajustes globales (`/admin/site-settings`), roster (`admin_team_members`), revista (`magazine_issues`), pedidos Tienda, etc."
      />

      <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <strong>Bloqueador para “guardar tema aquí”:</strong> haría falta una fila o tabla dedicada (p. ej.{" "}
        <code className="rounded bg-white/80 px-1">site_runtime_settings</code>), políticas RLS, y lectura en el layout público
        sin romper caché. Hasta entonces, cualquier botón “Save” sería falso — por eso los campos siguen deshabilitados.
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/site-settings" className={`${adminCtaChipSecondary} justify-center text-xs`}>
            Ajustes globales (persistidos) →
          </Link>
          <Link href="/admin/workspace" className={`${adminCtaChipSecondary} justify-center text-xs`}>
            Mapa de workspaces →
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
          <li>
            Permisos de roster opcionales: <code className="rounded bg-white/80 px-1 text-xs">ADMIN_ENFORCE_ROSTER_PERMISSIONS</code>{" "}
            + <code className="rounded bg-white/80 px-1 text-xs">ADMIN_OPERATOR_EMAIL</code> — ver Team.
          </li>
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
