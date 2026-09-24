import { resolveLeonixSiteOrigin } from "@/app/lib/siteOrigin";

export function getAutosSiteOrigin(): string {
  return resolveLeonixSiteOrigin();
}
