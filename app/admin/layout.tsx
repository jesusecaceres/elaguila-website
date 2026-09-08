import type { Metadata, Viewport } from "next";

/**
 * Admin is isolated from the public `(site)` layout — no live-site Navbar / Footer here.
 * Authenticated areas use AdminShell inside `(dashboard)/layout.tsx`.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Leonix Business Concierge",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/pwa/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7A1E2C",
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
