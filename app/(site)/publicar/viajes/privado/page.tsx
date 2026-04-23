import { Suspense } from "react";
import { redirect } from "next/navigation";

import { isViajesPrivatePublishDisabled } from "@/app/(site)/clasificados/viajes/lib/viajesPrivateLaneLaunchPolicy";

import { ViajesPrivadoApplicationShell } from "./components/ViajesPrivadoApplicationShell";

export default function PublicarViajesPrivadoPage() {
  if (isViajesPrivatePublishDisabled()) {
    redirect("/publicar/viajes?private_lane=disabled");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ViajesPrivadoApplicationShell />
    </Suspense>
  );
}
