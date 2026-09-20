/**
 * Optional launch scope: disable the private (particular) publish lane without removing code.
 *
 * Set `NEXT_PUBLIC_VIAJES_PRIVATE_LANE_DISABLED=1` on the deployment where private submissions
 * are out of scope. Effect:
 * - `/publicar/viajes/privado` redirects to `/publicar/viajes?private_lane=disabled`
 * - Publish hub hides the private card and shows an explicit notice
 *
 * When unset or not `"1"`, private publish remains available (default).
 */
export function isViajesPrivatePublishDisabled(): boolean {
  return process.env.NEXT_PUBLIC_VIAJES_PRIVATE_LANE_DISABLED === "1";
}
