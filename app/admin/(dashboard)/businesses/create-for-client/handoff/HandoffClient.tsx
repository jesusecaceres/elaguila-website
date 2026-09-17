"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";
import { seedServiciosDraftFromBusinessContext, type ServiciosSeedResult } from "@/app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext";
import { normalizePublicarGatewayDeepLink, resolvePublicarGatewayDestination } from "@/app/(site)/publicar/publicarGatewayResolver";
import { writeConciergeReturnContext } from "@/app/lib/business/applicationContext/conciergeReturnContext";

type Status = { kind: "working" } | { kind: "seeded"; result: ServiciosSeedResult; dest: string } | { kind: "error"; message: string };

/**
 * Runs in the SAME tab that will host the category application, because the existing category
 * draft stores are sessionStorage/IndexedDB — a new tab would never see the seed.
 */
export function HandoffClient() {
  const sp = useSearchParams();
  const businessId = (sp?.get("businessId") ?? "").trim();
  const category = normalizePublicarGatewayDeepLink(sp?.get("category"));
  const lang: "es" | "en" = sp?.get("lang") === "en" ? "en" : "es";
  const [status, setStatus] = useState<Status>({ kind: "working" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!businessId || !category) {
        setStatus({ kind: "error", message: "Falta el negocio o la categoría. / Missing business or category." });
        return;
      }
      const dest = resolvePublicarGatewayDestination(category, lang);
      // P0 Staff-Assisted Category Access (Gate 4) — passing ?category= lets this SAME request
      // also mint the short-lived signed assisted-publishing cookie (server-side, capability-
      // gated) on this same response, in this same tab, right before navigating into the real
      // category application — the one proven place a staff actor is re-verified server-side in
      // the same tab as the public route it then opens.
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(businessId)}/application-context?category=${encodeURIComponent(category)}`,
      );
      if (cancelled) return;
      if (!res.ok) {
        setStatus({ kind: "error", message: "No se pudo leer la Identidad del Negocio. / Could not read Business Identity." });
        return;
      }
      const data = (await res.json()) as {
        context: BusinessApplicationContext;
        staffActor?: { rosterId: string; email: string; role: string };
      };
      // Only Servicios has a seeder in this build; any other category simply continues into the
      // real application with no prefill (never a fake or partial seed into an unknown store).
      const result: ServiciosSeedResult = category === "servicios" ? seedServiciosDraftFromBusinessContext(data.context) : "storage_unavailable";
      // P0 Sales Ad Creation Flow (Gate 6) — write the return-context for EVERY category, prefill
      // or not, so the draft/edit/preview surfaces the real application already offers can show
      // "who this is for" and get staff back to the business. Never blocks the handoff on failure.
      writeConciergeReturnContext({
        businessId,
        businessName: data.context.publicName || data.context.businessName,
        category,
        createdByStaffActor: data.staffActor?.rosterId ?? "",
      });
      setStatus({ kind: "seeded", result, dest });
      window.location.assign(dest);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [businessId, category, lang]);

  return (
    <div className="max-w-xl space-y-3 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Crear para el cliente / Create for Client</p>
      {status.kind === "working" ? <p className="text-sm text-[#3D3428]">Preparando la aplicación con los datos del negocio… / Preparing the application with the business data…</p> : null}
      {status.kind === "seeded" ? (
        <>
          <p className="text-sm text-[#3D3428]">
            {status.result === "seeded"
              ? "Datos del negocio cargados. Abriendo la aplicación real… / Business data loaded. Opening the real application…"
              : status.result === "skipped_existing_draft"
                ? "Ya hay un borrador en esta pestaña — se conserva (el borrador existente gana). Abriendo… / A draft already exists in this tab — kept as-is (existing draft wins). Opening…"
                : "Sin prefill para esta categoría. Abriendo la aplicación real… / No prefill for this category. Opening the real application…"}
          </p>
          <Link href={status.dest} className="text-xs font-semibold text-[#7A1E2C] underline">Continuar manualmente / Continue manually</Link>
        </>
      ) : null}
      {status.kind === "error" ? (
        <>
          <p role="alert" className="text-sm text-red-700">{status.message}</p>
          <Link href="/admin/businesses/create-for-client" className="text-xs font-semibold text-[#7A1E2C] underline">← Volver / Back</Link>
        </>
      ) : null}
    </div>
  );
}
