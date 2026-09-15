/**
 * Gate 1 (PERF-001) — the Admin dashboard segment (`app/admin/(dashboard)/layout.tsx`) is a
 * `force-dynamic` async server component that resolves auth/session/nav data on every single
 * navigation. Until this file existed, there was zero `loading.tsx` anywhere under `app/admin`,
 * so Next.js had no automatic Suspense fallback to show while that layout's own awaits were in
 * flight — an operator clicking a nav link saw nothing at all for the full duration (previously
 * ~3.5s), which reads as "the UI became unclickable" even when the click was registered and a
 * navigation was already underway. This does not change what data loads or how fresh it is —
 * it only gives the operator immediate visual confirmation that their click landed.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--lx-page)]">
      <div className="flex flex-col items-center gap-3 text-[color:var(--lx-muted)]">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9B46A]/35 border-t-[#7A1E2C]"
          role="status"
          aria-label="Loading"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">Loading Admin…</p>
      </div>
    </div>
  );
}
