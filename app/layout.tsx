"use client";

import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BrandLogo from "./components/BrandLogo";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Floating Logo on ALL pages except cinematic intro */}
        <Suspense fallback={null}>
          <BrandLogo />
        </Suspense>

        {/* Global Navbar */}
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>

        {/* Page Content */}
        <Suspense fallback={null}>
          {children}
        </Suspense>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
