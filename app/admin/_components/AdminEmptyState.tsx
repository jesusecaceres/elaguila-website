import type { ReactNode } from "react";
import { adminCardBase } from "./adminTheme";

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${adminCardBase} p-8 text-center`}>
      <p className="text-base font-semibold text-[#1E1810]">{title}</p>
      {description ? <p className="mt-2 text-sm text-[#5C5346]/90">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
