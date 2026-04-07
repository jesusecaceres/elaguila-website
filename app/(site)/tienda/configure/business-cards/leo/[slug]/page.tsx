import { notFound } from "next/navigation";
import type { BusinessCardProductSlug } from "../../../../product-configurators/business-cards/types";
import { BusinessCardLeoShell } from "../../../../components/business-cards/BusinessCardLeoShell";
import type { Lang } from "../../../../types/tienda";
import { normalizeLang } from "../../../../utils/tiendaRouting";

const LEO_SLUGS: BusinessCardProductSlug[] = ["standard-business-cards", "two-sided-business-cards"];

function isLeoSlug(s: string): s is BusinessCardProductSlug {
  return LEO_SLUGS.includes(s as BusinessCardProductSlug);
}

export function generateStaticParams() {
  return LEO_SLUGS.map((slug) => ({ slug }));
}

export default async function BusinessCardLeoPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  if (!isLeoSlug(slug)) notFound();

  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  return <BusinessCardLeoShell productSlug={slug} lang={lang} />;
}
