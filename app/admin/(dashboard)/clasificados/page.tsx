import { redirect } from "next/navigation";

/** Legacy URL — Clasificados moderation lives in the website workspace. */
export default function LegacyAdminClasificadosRedirect() {
  redirect("/admin/workspace/clasificados");
}
