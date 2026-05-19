import { Suspense } from "react";
import { AutosDealerInventoryPageClient } from "./AutosDealerInventoryPageClient";

type PageProps = {
  params: Promise<{ dealerInventoryGroupId: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export default async function AutosDealerInventoryPage(props: PageProps) {
  const { dealerInventoryGroupId } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosDealerInventoryPageClient groupId={dealerInventoryGroupId} lang={lang} />
    </Suspense>
  );
}
