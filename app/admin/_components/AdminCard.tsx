import type { ReactNode } from "react";
import { adminCardBase } from "./adminTheme";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${adminCardBase} p-5 sm:p-6 ${className}`}>{children}</div>;
}
