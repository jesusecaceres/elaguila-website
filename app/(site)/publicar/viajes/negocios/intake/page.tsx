import type { Metadata } from "next";
import { Suspense } from "react";

import { ViajesIntakeShell } from "./components/ViajesIntakeShell";

export const metadata: Metadata = {
  title: "Publicar Viajes — Cuéntanos tu oportunidad | Leonix",
  description:
    "Cuéntanos qué ofreces y cómo beneficia a nuestra comunidad. Gratis para participar; revisado antes de publicar.",
};

export default function PublicarViajesIntakePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesIntakeShell />
    </Suspense>
  );
}
