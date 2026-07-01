type Props = {
  title: string;
  items: string[];
};

export function QuickJobBenefitsCard({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#4A4744]">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
