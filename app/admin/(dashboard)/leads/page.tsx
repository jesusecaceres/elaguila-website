import { redirect } from "next/navigation";

export default function AdminLeadsIndexPage() {
  redirect("/admin/leads/inbox");
}
