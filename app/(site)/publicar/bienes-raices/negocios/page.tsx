import { redirect } from "next/navigation";

/**
 * Stable public URL for “Publicar como Negocio” CTAs.
 * Continues in the existing Negocio selector + application flow.
 */
export default function PublicarBienesRaicesNegociosAliasPage() {
  redirect("/publicar/bienes-raices");
}
