import { ListingsCategoryOpsQueuePage } from "../_components/ListingsCategoryOpsQueuePage";

export const dynamic = "force-dynamic";

type P = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default function AdminMascotasListingsQueuePage(props: P) {
  return <ListingsCategoryOpsQueuePage categorySlug="mascotas-y-perdidos" searchParams={props.searchParams} />;
}
