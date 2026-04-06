import { AdminWorkspaceNav } from "../../_components/AdminWorkspaceNav";

export default function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminWorkspaceNav />
      {children}
    </div>
  );
}
