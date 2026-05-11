import { ListingsCategoryOpsQueuePage } from "../_components/ListingsCategoryOpsQueuePage";

export const dynamic = "force-dynamic";

type P = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default function AdminClasesListingsQueuePage(props: P) {
  return (
    <ListingsCategoryOpsQueuePage
      categorySlug="clases"
      title="Clases — listados públicos (operación)"
      searchParams={props.searchParams}
    />
  );
}
