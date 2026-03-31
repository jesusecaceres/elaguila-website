import { notFound } from "next/navigation";
import type { BusinessCardProductSlug } from "../../../product-configurators/business-cards/types";
import { BusinessCardBuilderShell } from "../../../components/business-cards/BusinessCardBuilderShell";
import type { Lang } from "../../../types/tienda";
import { normalizeLang } from "../../../utils/tiendaRouting";

const BUILDER_SLUGS: BusinessCardProductSlug[] = ["standard-business-cards", "two-sided-business-cards"];

function isBuilderSlug(s: string): s is BusinessCardProductSlug {
  return BUILDER_SLUGS.includes(s as BusinessCardProductSlug);
}

export function generateStaticParams() {
  return BUILDER_SLUGS.map((slug) => ({ slug }));
}

export default async function BusinessCardConfigurePage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string; entry?: string }>;
}) {
  const { slug } = await props.params;
  if (!isBuilderSlug(slug)) notFound();

  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);
  const designEntry: "template" | "custom" = sp.entry === "custom" ? "custom" : "template";

  return <BusinessCardBuilderShell key={`${slug}-${lang}-${designEntry}`} productSlug={slug} lang={lang} designEntry={designEntry} />;
}
