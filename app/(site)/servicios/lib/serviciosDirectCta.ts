/**
 * Direct Servicios contact actions — tel/sms/wa/mailto/maps without intermediate modals.
 */

export function buildServiciosGoogleMapsDirectionsUrl(addressOrUrl: string): string {
  const raw = addressOrUrl.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(raw)}`;
}

export function serviciosOpenTelHref(href: string): void {
  const raw = href.trim();
  if (!raw) return;
  window.location.href = raw.startsWith("tel:") ? raw : `tel:${raw}`;
}

export function serviciosOpenSmsHref(href: string): void {
  const raw = href.trim();
  if (!raw) return;
  window.location.href = raw.startsWith("sms:") ? raw : `sms:${raw}`;
}

export function serviciosOpenWhatsAppHref(href: string): void {
  const raw = href.trim();
  if (!raw) return;
  window.open(raw, "_blank", "noopener,noreferrer");
}

export function serviciosOpenMailtoHref(mailto: string): void {
  const raw = mailto.trim();
  if (!raw) return;
  window.location.href = raw.startsWith("mailto:") ? raw : `mailto:${raw}`;
}

export function serviciosOpenWebsiteUrl(url: string): void {
  const raw = url.trim();
  if (!raw) return;
  window.open(raw, "_blank", "noopener,noreferrer");
}

export function serviciosOpenGoogleMapsDirections(addressOrUrl: string, isMapsUrl?: boolean): void {
  const raw = addressOrUrl.trim();
  if (!raw) return;
  const mapsUrl =
    isMapsUrl === true || (/^https?:\/\//i.test(raw) && isMapsUrl !== false)
      ? raw
      : buildServiciosGoogleMapsDirectionsUrl(raw);
  window.open(mapsUrl, "_blank", "noopener,noreferrer");
}
