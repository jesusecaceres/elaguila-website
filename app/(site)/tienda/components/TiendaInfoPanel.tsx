import type { ReactNode } from "react";

export function TiendaInfoPanel(props: {
  title: string;
  children: ReactNode;
  variant?: "dark" | "cream";
}) {
  const { title, children, variant = "dark" } = props;
  const shell =
    variant === "cream"
      ? "rounded-3xl border border-[rgba(201,180,106,0.35)] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(255,252,247,0.90))] p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
      : "rounded-3xl border border-[rgba(255,255,255,0.10)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.30)]";

  const titleClass =
    variant === "cream"
      ? "text-lg font-semibold tracking-tight text-[color:var(--lx-text)]"
      : "text-lg font-semibold tracking-tight text-white";

  return (
    <section className={shell}>
      <h2 className={titleClass}>{title}</h2>
      <div className={variant === "cream" ? "mt-3 text-sm leading-relaxed text-[color:rgba(61,52,40,0.88)]" : "mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.75)]"}>
        {children}
      </div>
    </section>
  );
}
