import { redirect } from "next/navigation";

/** Legacy URL — revista admin vive en el workspace de secciones. */
export default function LegacyAdminMagazineRedirect() {
  redirect("/admin/workspace/revista");
}
