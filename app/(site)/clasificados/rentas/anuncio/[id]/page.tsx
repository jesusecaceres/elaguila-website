import { redirect } from "next/navigation";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";

type Props = { params: Promise<{ id: string }> };

/** Branch-scoped entry → canonical live detail (same row as `/clasificados/anuncio/[id]`). */
export default async function RentasLiveListingRedirectPage(props: Props) {
  const { id } = await props.params;
  if (!id) redirect("/clasificados/rentas/results");
  redirect(`${leonixLiveAnuncioPath(id)}?origen=rentas`);
}
