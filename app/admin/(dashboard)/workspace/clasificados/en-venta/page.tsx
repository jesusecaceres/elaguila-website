import { ListingsCategoryOpsQueuePage } from "../_components/ListingsCategoryOpsQueuePage";

export const dynamic = "force-dynamic";

type P = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default function AdminEnVentaListingsQueuePage(props: P) {
  return (
    <ListingsCategoryOpsQueuePage
      categorySlug="en-venta"
      title="En venta — listados públicos (operación)"
      searchParams={props.searchParams}
    />
  );
}
