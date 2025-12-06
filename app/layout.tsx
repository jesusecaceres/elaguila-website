import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Suspense } from "react";

export const metadata = {
  title: "El Águila en Vuelo",
  description: "Orgullo Latino Sin Fronteras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
