"use client";

import type { ReactNode } from "react";

export function BrSectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-[#FAFAFA] p-5 sm:p-6 shadow-sm">
      <h2 className="text-lg font-bold tracking-tight text-[#111111]">{title}</h2>
      {description ? <p className="mt-1.5 text-sm leading-relaxed text-[#111111]/72">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
