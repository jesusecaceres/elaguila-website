import Link from "next/link";
import ServiciosAdminClient from "../ServiciosAdminClient";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

export const metadata = {
  title: "Servicios · Sandbox tiers (admin)",
};

export default function AdminServiciosSandboxPage() {
  return (
    <div className="space-y-6">
      <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <p className="font-semibold text-[#1E1810]">Sandbox local (localStorage)</p>
        <p className="mt-1 text-xs">
          Esta pantalla no forma parte del flujo público de Servicios. Los datos no se guardan en{" "}
          <code className="rounded bg-white/80 px-1">servicios_public_listings</code>.
        </p>
        <Link href="/admin/workspace/clasificados/servicios" className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}>
          ← Volver a operaciones Servicios
        </Link>
      </div>
      <ServiciosAdminClient />
    </div>
  );
}
