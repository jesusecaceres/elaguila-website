import { redirect } from "next/navigation";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";

type Props = { params: Promise<{ id: string }> };

/** Branch-scoped entry → canonical live detail (same row as `/clasificados/anuncio/[id]`). */
export default async function BienesRaicesLiveListingRedirectPage(props: Props) {
  const { id } = await props.params;
  if (!id) redirect("/clasificados/bienes-raices/resultados");
  redirect(`${leonixLiveAnuncioPath(id)}?origen=br`);
}
