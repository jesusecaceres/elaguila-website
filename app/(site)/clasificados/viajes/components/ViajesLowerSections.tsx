import { ViajesSectionHeader } from "./ViajesSectionHeader";

/**
 * Lightweight shells for future editorial / partner content.
 */
export function ViajesLowerSections() {
  return (
    <div className="mt-12 space-y-10 sm:mt-14 sm:space-y-12 md:mt-16">
      <section className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/80 p-6 sm:p-8">
        <ViajesSectionHeader
          title="Agencias y socios destacados"
          subtitle="Pronto: perfiles verificados, especialidades y ofertas exclusivas para la comunidad Leonix."
          className="mb-0"
        />
      </section>
      <section className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/80 p-6 sm:p-8">
        <ViajesSectionHeader
          title="Guías e ideas para tu próximo viaje"
          subtitle="Pronto: inspiración por temporada, itinerarios y consejos prácticos en español."
          className="mb-0"
        />
      </section>
      <section className="rounded-2xl border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)]/80 p-6 sm:p-8">
        <ViajesSectionHeader
          title="Ofertas de temporada"
          subtitle="Pronto: promociones limitadas para verano, fiestas y puente largo."
          className="mb-0"
        />
      </section>
    </div>
  );
}
