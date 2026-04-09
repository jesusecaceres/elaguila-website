type Props = {
  title: string;
  items: string[];
};

export function QuickJobBenefitsCard({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="mt-6 rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(30,24,16,0.06)] sm:p-6">
      <h2 className="text-base font-bold text-[color:var(--lx-text)]">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
