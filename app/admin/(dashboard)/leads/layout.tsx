import type { ReactNode } from "react";
import { AdminLeadsSubnav } from "@/app/admin/_components/leads/AdminLeadsSubnav";

export default function AdminLeadsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <AdminLeadsSubnav />
      {children}
    </div>
  );
}
