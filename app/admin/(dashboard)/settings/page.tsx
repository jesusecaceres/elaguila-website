import { redirect } from "next/navigation";

/**
 * Launch Truth Doctrine (2026-09) — this page used to be a "Settings" stub with every control
 * (theme picker, save button) permanently disabled and never persisted. It is no longer linked
 * from primary nav or the Command Center; this redirect only protects anyone with an old
 * bookmark or link. /admin/site-settings is the real, working settings writer.
 */
export default function AdminSettingsPage() {
  redirect("/admin/site-settings");
}
