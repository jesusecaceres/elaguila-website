import { fetchClasificadosCategoryOpsAuditRows } from "@/app/admin/_lib/adminClasificadosCategoryOpsAudit";
import { mergeAdminCategoriesHubEntries } from "@/app/admin/_lib/adminCategoriesHubEntries";
import { assertAdminLeadExportAccess } from "@/app/admin/_lib/adminLeadExportAuth";
import { getClasificadosCategoryRegistryMerged } from "@/app/lib/clasificados/clasificadosCategoryRegistry";

export const runtime = "nodejs";

export async function GET() {
  const denied = await assertAdminLeadExportAccess();
  if (denied) return denied;

  const registryRaw = await getClasificadosCategoryRegistryMerged();
  const registry = mergeAdminCategoriesHubEntries(registryRaw);
  const rows = await fetchClasificadosCategoryOpsAuditRows(registry);

  return Response.json({ rows }, { headers: { "Cache-Control": "no-store" } });
}
