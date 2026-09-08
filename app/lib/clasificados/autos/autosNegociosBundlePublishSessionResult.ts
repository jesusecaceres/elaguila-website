/**
 * Client-safe session-result contract for the Autos negocios QA-bypass bundle publish flow.
 * Deliberately its own file, split out of `autosNegociosBundlePublish.ts`: that file's actual
 * publish function transitively imports `commercialWriteGuard.ts`/`capacityActivationRpc.ts`
 * (both `"server-only"`), and Next.js bundles anything statically imported from a "use client"
 * file into the client chunk regardless of which specific export is actually used — so importing
 * even just this constant/type from the server-tainted file broke the client build. This file has
 * zero server-only dependencies and is safe for both server and "use client" components to import.
 */
import type { AutosBundlePublishedVehicle } from "./autosNegociosBundlePublish";

export const AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY = "lx-autos-bundle-publish-result" as const;

export type AutosBundlePublishSessionResult = {
  mainListingId: string;
  published: AutosBundlePublishedVehicle[];
  totalPublished: number;
  qaBypass: boolean;
  inventoryIncluded: number;
  inventoryLimit: number;
};
