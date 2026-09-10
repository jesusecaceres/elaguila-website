/**
 * Public launch lock has been permanently retired for launch (same decision already
 * applied to the middleware copy of this gate in app/lib/launchLock/publicLaunchLock.ts).
 * Kept as the single root-layout contract so future routing changes have one obvious
 * place to look, without honoring the stale public-lock environment flag that could
 * otherwise render Coming Soon over the real site again.
 */
export async function ComingSoonGateRoot({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
