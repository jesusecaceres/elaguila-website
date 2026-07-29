import { redirect } from "next/navigation";
import { forwardPublishRedirectParams } from "@/app/lib/clasificados/forwardPublishRedirectParams";

/**
 * Gate I.5.3 — legacy entry: forward to the canonical Empleos hub at /publicar/empleos.
 *
 * Proven safe: this page previously rendered EmpleosPublicarHubClient with
 * variant="clasificadosPublicar", which resolves to the IDENTICAL quick/feria destination hrefs
 * as the "default" variant already served at /publicar/empleos (same EMPLEOS_PUBLISH_ROUTES
 * constants, same computation) — the only difference between the two variants is visual
 * (card layout/back-link chrome), never a destination or a distinct product/pricing path. That
 * makes this the same category as the already-implemented Busco/Clases/Comunidad/Mascotas y
 * Perdidos shims, not the Servicios/Bienes Raíces/Restaurantes cases (which do have unique
 * behavior and were NOT redirected — see the Gate I.5.3 report).
 *
 * Forwards the complete incoming search-parameter set (not lang-only), per this gate's stricter
 * parameter-preservation requirement.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarEmpleosRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  redirect(forwardPublishRedirectParams("/publicar/empleos", sp));
}
