import type { ReactNode } from "react";
import { adminCardMuted } from "./adminTheme";

export function AdminSectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${adminCardMuted} p-5 sm:p-6 ${className}`}>
      <h2 className="text-lg font-bold text-[#1E1810]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#5C5346]/90">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
