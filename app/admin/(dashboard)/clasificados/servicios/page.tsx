import { redirect } from "next/navigation";

export default function LegacyAdminServiciosRedirect() {
  redirect("/admin/workspace/clasificados/servicios");
}
