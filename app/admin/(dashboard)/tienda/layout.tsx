import { AdminTiendaWorkspaceSubnav } from "../../_components/AdminTiendaWorkspaceSubnav";
import { AdminWorkspaceNav } from "../../_components/AdminWorkspaceNav";

/**
 * Tienda CRUD lives under `/admin/tienda/*`; this layout keeps the same second-layer
 * website-section nav as workspaces so the team always sees where they are.
 */
export default function AdminTiendaSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminWorkspaceNav />
      <AdminTiendaWorkspaceSubnav />
      {children}
    </div>
  );
}
