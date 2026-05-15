import { ListingsCategoryOpsQueuePage } from "../_components/ListingsCategoryOpsQueuePage";

export const dynamic = "force-dynamic";

type P = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default function AdminComunidadListingsQueuePage(props: P) {
  return <ListingsCategoryOpsQueuePage categorySlug="comunidad" searchParams={props.searchParams} />;
}
