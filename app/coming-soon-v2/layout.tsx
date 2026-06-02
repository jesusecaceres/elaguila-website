/**
 * Standalone launch preview — lives outside `(site)` so the global Navbar,
 * sitewide banners, and Footer are never rendered on this route.
 */
export default function ComingSoonV2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
