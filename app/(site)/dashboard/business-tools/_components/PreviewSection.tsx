import type { BusinessIdentityCopy } from "./businessIdentityCopy";

/**
 * The inspirational, truthful preview (Phase 4). Shown to preview_only and ineligible users
 * alike — no fake customers, no fake analytics, no fake AI findings. Future capabilities are
 * always explicitly labeled as upcoming, never presented as existing.
 */
export function PreviewSection({ t }: { t: BusinessIdentityCopy["preview"] }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#F3EBDD]/90 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">{t.heroEyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.heroTitle}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C5346]/95">{t.heroLead}</p>
      </section>

      <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
        <h3 className="text-base font-bold text-[#1E1810]">{t.helpTitle}</h3>
        <ul className="mt-3 space-y-2">
          {t.helpItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#3D3428]/95">
              <span aria-hidden="true" className="mt-0.5 text-[#C9A84A]">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
        <h3 className="text-base font-bold text-[#1E1810]">{t.promiseTitle}</h3>
        <ul className="mt-3 space-y-2">
          {t.promiseItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#3D3428]/95">
              <span aria-hidden="true" className="mt-0.5 text-[#7A1E2C]">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 sm:p-8">
        <h3 className="text-base font-bold text-[#1E1810]">{t.journeyTitle}</h3>
        <ol className="mt-4 flex flex-wrap gap-2" aria-label={t.journeyTitle}>
          {t.journeySteps.map((step, i) => (
            <li
              key={step}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#3D3428]"
            >
              <span aria-hidden="true" className="text-[#C9A84A]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFCF7] to-[#F3EBDD]/90 p-6 sm:p-8">
        <h3 className="text-base font-bold text-[#1E1810]">{t.eligibilityTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.eligibilityLead}</p>
        <a
          href="/publicar"
          className="mt-4 inline-flex rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
        >
          {t.eligibilityCta}
        </a>
      </section>

      <section className="rounded-3xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/70 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#1E1810]">{t.ideaTitle}</h3>
          <span className="inline-flex items-center rounded-full border border-[#D6C7AD]/70 bg-[#F3EBDD]/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
            {t.ideaBadge}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/95">{t.ideaLead}</p>
      </section>
    </div>
  );
}
