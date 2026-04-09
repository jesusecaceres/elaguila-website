import { adminCardBase } from "@/app/admin/_components/adminTheme";

/** Internal-only: how business-lane content is intended to surface publicly (distinct from affiliate). */
export function AdminViajesBusinessSurfaceMap() {
  return (
    <div className={`${adminCardBase} mb-6 border border-emerald-200/80 bg-emerald-50/60 p-5`}>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-950">Public surface map (business lane)</p>
      <p className="mt-2 text-sm text-[#1E1810]">
        Operator-submitted offers and profiles are moderated separately from affiliate cards. They feed business-specific surfaces — never the affiliate disclosure pattern.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-emerald-950">Business profiles</p>
          <p className="mt-1 text-[#5C5346]">
            Approved operators surface on <code className="rounded bg-emerald-100 px-1">/clasificados/viajes/negocio/[slug]</code> with identity, trust copy, and outbound contact — Leonix remains discovery/referral, not merchant of record.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-emerald-950">Public business offers</p>
          <p className="mt-1 text-[#5C5346]">
            Live offer slugs map to <code className="rounded bg-emerald-100 px-1">/clasificados/viajes/oferta/[slug]</code> using the same detail shell as curated samples, with business (non-affiliate) partner block and CTAs.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-emerald-950">Results visibility</p>
          <p className="mt-1 text-[#5C5346]">
            Once wired, approved business offers join results eligibility on <code className="rounded bg-emerald-100 px-1">/clasificados/viajes/resultados</code> with clear labeling distinct from affiliate inventory.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-emerald-950">Draft / preview lanes</p>
          <p className="mt-1 text-[#5C5346]">
            Public publish flows use <code className="rounded bg-emerald-100 px-1">/clasificados/viajes/preview/negocios</code> (business draft) and <code className="rounded bg-emerald-100 px-1">…/preview/privado</code> (private) — local-only until backend ingest exists.
          </p>
        </div>
      </div>
    </div>
  );
}
