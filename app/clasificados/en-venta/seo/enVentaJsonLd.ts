export function enVentaClassifiedAdJsonLd(params: {
  title: string;
  description: string;
  url: string;
  priceLabel: string;
  city: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ClassifiedAd",
    name: params.title,
    description: params.description,
    url: params.url,
    price: params.priceLabel,
    priceCurrency: "USD",
    address: {
      "@type": "PostalAddress",
      addressLocality: params.city,
      addressRegion: "CA",
      addressCountry: "US",
    },
  };
}
