import type { ReactNode } from "react";

/**
 * Padded, bordered wrapper for the publishable ad surface (preview + public open-card alignment).
 * Chrome (e.g. “Volver a editar”) must live outside this container.
 */
export function ClasificadosPreviewAdCanvas({
  children,
  className = "",
}: {
  children: ReactNode;
  /** Extra classes on the outer frame */
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1280px] rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_12px_48px_-20px_rgba(42,36,22,0.18)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
