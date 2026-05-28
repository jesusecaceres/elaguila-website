import type { Metadata } from "next";

/**
 * Admin is isolated from the public `(site)` layout — no live-site Navbar / Footer here.
 * Authenticated areas use AdminShell inside `(dashboard)/layout.tsx`.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
