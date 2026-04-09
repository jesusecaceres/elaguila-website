import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { emptyAffiliateFormState } from "@/app/admin/_lib/adminViajesAffiliateFormState";

import { AdminViajesAffiliateOfferForm } from "../AdminViajesAffiliateOfferForm";

export default function AdminViajesAffiliateNewPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · affiliate lane"
        title="New affiliate offer"
        subtitle="Internal content-ops form. Saving is disabled until the Viajes affiliate API exists."
      />
      <AdminViajesAffiliateOfferForm mode="create" initial={emptyAffiliateFormState()} />
    </>
  );
}
