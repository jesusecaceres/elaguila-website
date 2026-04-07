import type { RestauranteInternalContract, RestauranteListingApplication } from "./restauranteListingApplicationModel";

/** Local publish draft: same shape as listing minus server-owned internal contract (§M). */
export type RestauranteListingDraft = Omit<RestauranteListingApplication, keyof RestauranteInternalContract> & {
  draftListingId: string;
};
