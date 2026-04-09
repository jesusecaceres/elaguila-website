import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import {
  ADMIN_VIAJES_AFFILIATE_OFFERS_MOCK,
  getAdminAffiliateOfferById,
} from "@/app/admin/_lib/adminViajesAffiliateOffersMock";

import { offerToAffiliateFormState } from "@/app/admin/_lib/adminViajesAffiliateFormState";

import { AdminViajesAffiliateOfferForm } from "../../AdminViajesAffiliateOfferForm";

export function generateStaticParams() {
  return ADMIN_VIAJES_AFFILIATE_OFFERS_MOCK.map((r) => ({ id: r.id }));
}

type Props = { params: Promise<{ id: string }> };

export default async function AdminViajesAffiliateEditPage({ params }: Props) {
  const { id } = await params;
  const row = getAdminAffiliateOfferById(id);
  if (!row) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · affiliate lane"
        title={`Edit · ${row.headline}`}
        subtitle={`Internal id ${row.id}. Partner: ${row.partnerName}.`}
      />
      <AdminViajesAffiliateOfferForm mode="edit" initial={offerToAffiliateFormState(row)} />
    </>
  );
}
