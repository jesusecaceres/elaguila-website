import { notFound } from "next/navigation";
import type { BusinessCardProductSlug } from "../../../../product-configurators/business-cards/types";
import { BusinessCardUploadShell } from "../../../../components/business-cards/BusinessCardUploadShell";
import type { Lang } from "../../../../types/tienda";
import { normalizeLang } from "../../../../utils/tiendaRouting";

const UPLOAD_SLUGS: BusinessCardProductSlug[] = ["standard-business-cards", "two-sided-business-cards"];

function isUploadSlug(s: string): s is BusinessCardProductSlug {
  return UPLOAD_SLUGS.includes(s as BusinessCardProductSlug);
}

export function generateStaticParams() {
  return UPLOAD_SLUGS.map((slug) => ({ slug }));
}

export default async function BusinessCardUploadConfigurePage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { slug } = await props.params;
  if (!isUploadSlug(slug)) notFound();

  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  return <BusinessCardUploadShell key={`${slug}-up-${lang}`} productSlug={slug} lang={lang} />;
}
