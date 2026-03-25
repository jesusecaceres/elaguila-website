export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67C52]">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C5346]/95">{subtitle}</p> : null}
    </header>
  );
}
