import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://leonixmedia.com"),
  title: {
    default: "LEONIX Media",
    template: "LEONIX Media — %s",
  },
  description: "Que Ruja El León — Let The Lion Roar",
  keywords: [
    "LEONIX",
    "LEONIX Media",
    "El Águila",
    "Clasificados",
    "San José",
    "Bahía",
    "Latino",
    "Noticias",
    "Eventos",
    "Cupones",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://leonixmedia.com",
  },
  openGraph: {
    title: "LEONIX Media",
    description: "Que Ruja El León — Let The Lion Roar",
    url: "https://leonixmedia.com",
    siteName: "LEONIX Media",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "LEONIX Media",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEONIX Media",
    description: "Que Ruja El León — Let The Lion Roar",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
