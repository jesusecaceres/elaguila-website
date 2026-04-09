import Link from "next/link";

import { AdminViajesLaneLegend } from "./_components/AdminViajesLaneLegend";
import { AdminViajesSubnav } from "./_components/AdminViajesSubnav";

export default function AdminViajesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A67C52]">Clasificados</p>
          <h2 className="text-lg font-bold text-[#1E1810]">Viajes</h2>
        </div>
        <Link
          href="/clasificados/viajes"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#6B5B2E] underline underline-offset-2 hover:text-[#1E1810]"
        >
          View public Viajes →
        </Link>
      </div>
      <p className="mb-4 max-w-3xl text-xs leading-relaxed text-[#5C5346]">
        Internal tools for the three Viajes lanes: <strong>affiliate</strong> (partner-managed here),{" "}
        <strong>business</strong> (approved operator listings), and <strong>editorial</strong> (Leonix content). Not
        exposed on public publish flows. Affiliate authoring stays in this admin area only — the public{" "}
        <Link href="/publicar/viajes" className="font-semibold text-[#6B5B2E] underline underline-offset-2">
          /publicar/viajes
        </Link>{" "}
        branch is for vetted businesses, not partner inventory. The public publish hub also includes a private (particular) draft path — still not affiliate authoring.
      </p>
      <AdminViajesLaneLegend />
      <AdminViajesSubnav />
      {children}
    </div>
  );
}
