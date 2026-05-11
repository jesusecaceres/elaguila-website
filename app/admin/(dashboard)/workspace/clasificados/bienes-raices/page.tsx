import { ListingsCategoryOpsQueuePage } from "../_components/ListingsCategoryOpsQueuePage";

export const dynamic = "force-dynamic";

type P = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default function AdminBienesRaicesListingsQueuePage(props: P) {
  return (
    <ListingsCategoryOpsQueuePage
      categorySlug="bienes-raices"
      title="Bienes raíces — listados públicos (operación)"
      searchParams={props.searchParams}
    />
  );
}
