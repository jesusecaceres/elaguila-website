"use client";

import type { ReactNode } from "react";

type Lang = "es" | "en";

export type SectionShellProps = {
  /** Reserved for localized section chrome; callers pass `lang` for consistency. */
  lang?: Lang;
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Category-owned section chrome for En Venta publish applications (free / pro).
 */
export default function SectionShell({ title, description, children }: SectionShellProps) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#111111]">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[#111111]/70">{description}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
