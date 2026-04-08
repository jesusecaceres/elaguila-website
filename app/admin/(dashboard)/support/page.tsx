import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnSecondary,
  adminInputClass,
  adminReadOnlyBadgeClass,
  adminStubBadgeClass,
  adminCtaChipSecondary,
} from "../../_components/adminTheme";
import { getSupabaseAuthUsersDashboardUrl } from "../../_lib/supabaseDashboardLinks";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  const authDashboardUrl = getSupabaseAuthUsersDashboardUrl();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>Parcial</span>
        <span className={adminStubBadgeClass}>Tickets no modelados</span>
      </div>
      <AdminPageHeader
        title="Support"
        subtitle="Consola de operador: búsqueda y colas reales viven en Users, Ops y Reportes. Los tickets formales aún no tienen tabla."
        helperText="Habilitar/deshabilitar cuenta: Users → ficha → Habilitar/Deshabilitar (Supabase `profiles.is_disabled`). Contraseña: solo vía Supabase Auth o flujo seguro, no desde este panel."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form className={`${adminCardBase} p-6`} action="/admin/ops" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Unified records search</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Cuenta + anuncios Clasificados + pedidos Tienda en una pasada (límite por sección).
          </p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-ops-q">
            Query
          </label>
          <input id="support-ops-q" name="q" className={`${adminInputClass} mt-1`} placeholder="UUID, email, listing id, order ref…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}>
            Open Customer ops →
          </button>
        </form>

        <form className={`${adminCardBase} p-6`} action="/admin/usuarios" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Quick user lookup</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Solo perfiles — lista y detalle existentes.</p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-user-q">
            Query
          </label>
          <input id="support-user-q" name="q" className={`${adminInputClass} mt-1`} placeholder="Email, ref, name…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}>
            Open in Users →
          </button>
        </form>

        <div className={`${adminCardBase} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-[#1E1810]">Escalation tags</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            <span className="mr-2 inline-block rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
              Solo UI
            </span>
            Para enrutamiento futuro — no se guardan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Billing", "Technical", "Fraud", "Content"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-1 text-xs font-bold text-[#3D3428]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Acciones de cuenta (sin atajos mágicos)</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
          <strong className="text-[#1E1810]">Desbloquear / bloquear:</strong> usa{" "}
          <Link href="/admin/usuarios" className="font-bold text-[#6B5B2E] underline">
            Users
          </Link>{" "}
          → ficha del cliente → <strong>Habilitar</strong> o <strong>Deshabilitar</strong> (acción real en base).
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[#7A7164]">
          <strong className="text-[#1E1810]">Contraseña / magic link:</strong> no se generan enlaces en este navegador por seguridad.
          Usa el panel de Supabase Auth para enviar recuperación o invitación.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/admin/usuarios" className={`${adminCtaChipSecondary} justify-center`}>
            Ir a Users →
          </Link>
          {authDashboardUrl ? (
            <a
              href={authDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className={`${adminCtaChipSecondary} justify-center`}
              title="Abre el listado de usuarios Auth del proyecto (contraseña, email, etc.)"
            >
              Supabase Auth · Users ↗
            </a>
          ) : (
            <span className="text-xs text-[#9A9084]">Configura NEXT_PUBLIC_SUPABASE_URL para enlazar al dashboard.</span>
          )}
        </div>
        <p className="mt-4 text-xs font-semibold text-[#7A7164]">
          Réplica “como el usuario” / modo remoto:{" "}
          <span className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
            No disponible
          </span>{" "}
          — fuera de alcance por seguridad y cookies.
        </p>
        <div className="mt-6">
          <label className="text-xs font-semibold text-[#5C5346]">Internal notes (local only — not saved)</label>
          <textarea
            className={`${adminInputClass} mt-1 min-h-[100px]`}
            disabled
            placeholder="Futuro: notas internas cifradas + audit trail."
          />
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} inline-flex`}>
          Open reports queue →
        </Link>
      </div>
    </div>
  );
}
