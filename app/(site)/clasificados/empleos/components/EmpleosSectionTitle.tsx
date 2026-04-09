type Props = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function EmpleosSectionTitle({ children, className = "", id }: Props) {
  return (
    <h2
      id={id}
      className={`text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl ${className}`}
    >
      {children}
    </h2>
  );
}
