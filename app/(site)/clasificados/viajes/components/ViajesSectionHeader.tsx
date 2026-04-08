type ViajesSectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function ViajesSectionHeader({ title, subtitle, className = "" }: ViajesSectionHeaderProps) {
  return (
    <header className={`text-center sm:text-left ${className}`}>
      <h2 className="text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:mx-0 sm:text-[0.9375rem]">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
