type Props = {
  title: string;
  items: string[];
};

export function QuickJobBenefitsCard({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="mt-5 rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_8px_28px_rgba(42,40,38,0.06)] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A5A18]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#4A4744]">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A85A]" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
