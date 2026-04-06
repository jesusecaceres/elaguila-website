import { redirect } from "next/navigation";

/** Antigua ruta “Website content” — usar Ajustes globales del sitio. */
export default function LegacyWebsiteContentRedirect() {
  redirect("/admin/site-settings");
}
