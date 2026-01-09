import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Suspense } from "react";

export const metadata = {
  title: "LEONIX Media",
  description: "Que Ruja El León — Let The Lion Roar",
  openGraph: {
    title: "LEONIX Media",
    description: "Que Ruja El León — Let The Lion Roar",
    siteName: "LEONIX Media",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LEONIX Media",
    description: "Que Ruja El León — Let The Lion Roar",
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
