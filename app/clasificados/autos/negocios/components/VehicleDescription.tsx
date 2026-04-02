import type { AutoDealerListing } from "../types/autoDealerListing";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.06)]";

export function VehicleDescription({ data }: { data: AutoDealerListing }) {
  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">Descripción del concesionario</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">Resumen proporcionado por {data.dealerName}</p>
      <p className="mt-4 max-w-[65ch] text-[15px] leading-[1.7] text-[color:var(--lx-text-2)]">{data.description}</p>
    </section>
  );
}
