/**
 * Admin is isolated from the public `(site)` layout — no live-site Navbar / Footer here.
 * Authenticated areas use AdminShell inside `(dashboard)/layout.tsx`.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
