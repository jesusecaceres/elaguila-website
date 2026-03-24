"use client";

import type { ReactNode } from "react";

type Lang = "es" | "en";

export default function SectionShell({
  lang: _lang,
  title,
  description,
  children,
}: {
  lang: Lang;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#111111]">{title}</h2>
      {description ? <p className="mt-1 text-sm text-[#111111]/65">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
