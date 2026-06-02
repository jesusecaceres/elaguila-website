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
            aria-describedby="rail-user-hint"
            autoComplete="off"
          />
          <p id="rail-user-hint" className="text-[10px] leading-snug text-[#7A7164]">
            Opens the user list with your text in <span className="font-mono">?q=</span> (email, name, UUID…).
          </p>
          <button
            type="submit"
            className={`${adminBtnSecondary} flex min-h-[44px] w-full items-center justify-center text-xs sm:min-h-0`}
            title="Go to /admin/usuarios with search parameter"
          >
            Go to user list →
          </button>
        </form>
        <form className="mt-3 space-y-2" action="/admin/workspace/clasificados" method="get">
          <label className="sr-only" htmlFor="rail-ad-q">
            Ad search
          </label>
          <input
            id="rail-ad-q"
            name="q"
            placeholder="Title fragment, city, or ID…"
            className={`${adminInputClass} min-h-[44px] text-base sm:min-h-0 sm:text-sm`}
            title="Opens Classifieds with ?q=; filtering happens on the workspace page"
          />
          <p className="text-[10px] text-[#7A7164]">
            Only navigates to the queue with text in the URL; does not run a separate search. Filter on the Classifieds page.
          </p>
          <button
            type="submit"
            className={`${adminBtnSecondary} flex min-h-[44px] w-full items-center justify-center text-xs sm:min-h-0`}
            title="Go to /admin/workspace/clasificados with q parameter"
          >
            Go to Classifieds queue →
          </button>
        </form>
      </div>

      <div className="space-y-2 border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Auth (not in this rail)</p>
        <p className="text-[10px] leading-snug text-[#7A7164]">
          Password and magic link:{" "}
          <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
            Support
          </Link>{" "}
          → link to Supabase Auth. No user impersonation.
        </p>
        <button
          type="button"
          disabled
          className="flex min-h-[44px] w-full cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80 sm:min-h-0"
          title="Use Supabase Dashboard → Authentication → Users to send recovery"
        >
          🔑 Reset user password (Supabase only)
        </button>
        <button
          type="button"
          disabled
          className="flex min-h-[44px] w-full cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80 sm:min-h-0"
          title="User session replica is not available for security"
        >
          🪞 Switch to user dashboard (not available)
        </button>
        <Link
          href="/admin/workspace/clasificados"
          className={`${adminBtnSecondary} w-full justify-center text-xs`}
          title="Opens the listings queue; does not open a specific ad"
        >
          Open Classifieds queue
        </Link>
        <Link
          href="/admin/team"
          className={`${adminBtnDark} w-full justify-center text-xs`}
          title="Team: invite intent may be saved in admin_team_invites"
        >
          Go to Team
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
