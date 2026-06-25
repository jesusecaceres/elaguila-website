import { redirect } from "next/navigation";

/** Owner-friendly alias — site section hub lives at `/admin/workspace`. */
export default function AdminSiteSectionsAliasPage() {
  redirect("/admin/workspace");
}
