"use client";

import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LogoFloating from "./components/LogoFloating"; 
import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <LogoFloating /> 
        </Suspense>

        <Suspense fallback={null}>
          <Navbar />
        </Suspense>

        <Suspense fallback={null}>
          {children}
        </Suspense>

        <Footer />
      </body>
    </html>
  );
}
