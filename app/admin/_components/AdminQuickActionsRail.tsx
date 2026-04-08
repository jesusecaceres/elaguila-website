import Link from "next/link";
import { adminBtnDark, adminBtnSecondary, adminInputClass, adminCtaChipCompact } from "./adminTheme";

/**
 * Dashboard-only quick actions. Password reset / replica require Supabase Dashboard or IdP — not in-app (see Support page).
 */
export function AdminQuickActionsRail() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Quick actions</p>
        <form className="mt-3 space-y-2" action="/admin/usuarios" method="get">
          <label className="sr-only" htmlFor="rail-user-q">
            Search users
          </label>
          <input
            id="rail-user-q"
            name="q"
            placeholder="Search users…"
            className={`${adminInputClass} min-h-[44px] text-base sm:min-h-0 sm:text-sm`}
          />
          <button
            type="submit"
            className={`${adminBtnSecondary} flex min-h-[44px] w-full items-center justify-center text-xs sm:min-h-0`}
          >
            Go →
          </button>
        </form>
        <form className="mt-3 space-y-2" action="/admin/workspace/clasificados" method="get">
          <label className="sr-only" htmlFor="rail-ad-q">
            Ad search
          </label>
          <input
            id="rail-ad-q"
            name="q"
            placeholder="Fragmento de título, ciudad o ID…"
            className={`${adminInputClass} min-h-[44px] text-base sm:min-h-0 sm:text-sm`}
            title="Abre Clasificados con ?q=; el filtrado ocurre en la página del workspace"
          />
          <p className="text-[10px] text-[#7A7164]">
            Solo navega a la cola con el texto en la URL; no ejecuta búsqueda aparte. Filtra en la página de Clasificados.
          </p>
          <button
            type="submit"
            className={`${adminBtnSecondary} flex min-h-[44px] w-full items-center justify-center text-xs sm:min-h-0`}
            title="Ir a /admin/workspace/clasificados con parámetro q"
          >
            Ir a cola Clasificados →
          </button>
        </form>
      </div>

      <div className="space-y-2 border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Auth (no en esta barra)</p>
        <p className="text-[10px] leading-snug text-[#7A7164]">
          Contraseña y magic link:{" "}
          <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
            Support
          </Link>{" "}
          → enlace a Supabase Auth. Sin suplantación de usuario.
        </p>
        <button
          type="button"
          disabled
          className="flex min-h-[44px] w-full cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80 sm:min-h-0"
          title="Usa Supabase Dashboard → Authentication → Users para enviar recuperación"
        >
          🔑 Reset user password (solo vía Supabase)
        </button>
        <button
          type="button"
          disabled
          className="flex min-h-[44px] w-full cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80 sm:min-h-0"
          title="Réplica de sesión de usuario no está disponible por seguridad"
        >
          🪞 Switch to user dashboard (no disponible)
        </button>
        <Link
          href="/admin/workspace/clasificados"
          className={`${adminBtnSecondary} w-full justify-center text-xs`}
          title="Abre la cola de anuncios; no abre un anuncio concreto"
        >
          Abrir cola Clasificados
        </Link>
        <Link
          href="/admin/team"
          className={`${adminBtnDark} w-full justify-center text-xs`}
          title="Team: intención de invitación puede guardarse en admin_team_invites"
        >
          Ir a Team
        </Link>
      </div>

      <div className="border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Admin team</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Root owner (cookie)
          </li>
          <li className="text-xs text-[#7A7164]">Invite-based roster — see Team page for roles.</li>
        </ul>
        <Link href="/admin/team" className={`${adminCtaChipCompact} mt-3 w-full justify-center`}>
          Manage team →
        </Link>
      </div>
    </div>
  );
}
