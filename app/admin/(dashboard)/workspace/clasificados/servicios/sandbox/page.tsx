import Link from "next/link";
import ServiciosAdminClient from "../ServiciosAdminClient";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";

export const metadata = {
  title: "Servicios · Tier sandbox (admin)",
};

export default function AdminServiciosSandboxPage() {
  return (
    <div className="space-y-6">
      <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <p className="font-semibold text-[#1E1810]">Local sandbox (localStorage)</p>
        <p className="mt-1 text-xs">
          This screen is not part of the public Servicios flow. Data is not saved to{" "}
          <code className="rounded bg-white/80 px-1">servicios_public_listings</code>.
        </p>
        <Link href="/admin/workspace/clasificados/servicios" className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}>
          ← Back to Servicios operations
        </Link>
      </div>
      <ServiciosAdminClient />
    </div>
  );
}
