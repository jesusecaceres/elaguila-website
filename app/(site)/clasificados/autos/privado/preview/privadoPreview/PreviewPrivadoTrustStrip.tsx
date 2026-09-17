import { previewPrivadoCopy, type PreviewPrivadoLang } from "./previewPrivadoCopy";

export function PreviewPrivadoTrustStrip({ lang }: { lang: PreviewPrivadoLang }) {
  const copy = previewPrivadoCopy(lang);
  const items = [copy.trustClear, copy.trustDirect, copy.trustReview, copy.trustSupport];

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((label) => (
        <div
          key={label}
          className="flex min-h-[72px] items-center justify-center rounded-[10px] border border-[#D6C7AD]/70 bg-[#FFFDF7] px-2 py-2 text-center text-xs font-semibold text-[#1F241C] shadow-sm"
        >
          {label}
        </div>
      ))}
    </section>
  );
}
