"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { ReactNode } from "react";

export function EmpleosSectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function EmpleosFieldLabel({
  children,
  optional,
  required,
  lang = "es",
}: {
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  /** UI language for the “(optional)” suffix. */
  lang?: Lang;
}) {
  const star = Boolean(required) && !optional;
  const optWord = lang === "en" ? "optional" : "opcional";
  return (
    <span className="block text-sm font-semibold text-[color:var(--lx-text)]">
      {children}
      {optional ? <span className="ml-1 font-normal text-[color:var(--lx-muted)]">({optWord})</span> : null}
      {star ? (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      ) : null}
    </span>
  );
}
