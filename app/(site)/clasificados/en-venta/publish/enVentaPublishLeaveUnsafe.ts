/** Module flags for Varios publish leave — only warn on unload when truly unsafe. */

let publishInFlight = false;
let mediaUploadInFlight = false;

export function setEnVentaPublishInFlight(active: boolean): void {
  publishInFlight = active;
}

export function setEnVentaMediaUploadInFlight(active: boolean): void {
  mediaUploadInFlight = active;
}

export function enVentaHasUnsafeLeaveState(): boolean {
  return publishInFlight || mediaUploadInFlight;
}
