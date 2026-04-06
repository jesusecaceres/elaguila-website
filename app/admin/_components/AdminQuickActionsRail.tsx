import Link from "next/link";
import { adminBtnDark, adminBtnSecondary, adminInputClass } from "./adminTheme";

/**
 * Dashboard-only quick actions. Reset password / replica / verify are UI stubs — no secret flows in browser.
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
          <input id="rail-user-q" name="q" placeholder="Search users…" className={adminInputClass} />
          <button type="submit" className={`${adminBtnSecondary} w-full justify-center text-xs`}>
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
            placeholder="Search ads (listing UUID substring)…"
            className={adminInputClass}
          />
          <p className="text-[10px] text-[#7A7164]">
            {/* Future: public_publish_id when added to listings — today matches title/substring filters client-side could be added */}
            Uses list search field when wired; for now navigates with query string for future table filter.
          </p>
          <button type="submit" className={`${adminBtnSecondary} w-full justify-center text-xs`}>
            Search ads →
          </button>
        </form>
      </div>

      <div className="space-y-2 border-t border-[#E8DFD0]/80 pt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Operations (stubs)</p>
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80"
          title="Requires Auth Admin API — not wired"
        >
          🔑 Reset user password
        </button>
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/80 px-3 py-2 text-left text-xs font-semibold text-[#5C5346]/80"
        >
          🪞 Switch to user dashboard (replica)
        </button>
        <Link
          href="/admin/workspace/clasificados"
          className={`${adminBtnSecondary} w-full justify-center text-xs`}
          title="Workspace Clasificados — cola de anuncios"
        >
          ✓ Quick verify ad (open Ads)
        </Link>
        <Link href="/admin/team" className={`${adminBtnDark} w-full justify-center text-xs`}>
          + Add team member
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
        <Link href="/admin/team" className="mt-3 block text-center text-xs font-bold text-[#6B5B2E] underline">
          Manage team →
        </Link>
      </div>
    </div>
  );
}
