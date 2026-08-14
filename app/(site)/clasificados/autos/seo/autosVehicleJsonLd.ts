/**
 * Package F Build F2, Gate 15 (P1 SEO fix) — real, non-fabricated Vehicle structured data. Every
 * field is sourced directly from the published listing row; fields with no real data (VIN,
 * dealer rating, availability beyond "active listing") are simply omitted, never fabricated.
 */
export function autosVehicleJsonLd(params: {
  title: string;
  url: string;
  imageUrl?: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage?: number;
  bodyStyle?: string;
  transmission?: string;
  driveWheelConfiguration?: string;
  fuelType?: string;
  color?: string;
  city?: string;
  state?: string;
}) {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: params.title,
    url: params.url,
    vehicleModelDate: String(params.year),
    brand: { "@type": "Brand", name: params.make },
    model: params.model,
    offers: {
      "@type": "Offer",
      price: params.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
  if (params.imageUrl) json.image = params.imageUrl;
  if (params.mileage != null) {
    json.mileageFromOdometer = { "@type": "QuantitativeValue", value: params.mileage, unitCode: "SMI" };
  }
  if (params.bodyStyle) json.bodyType = params.bodyStyle;
  if (params.transmission) json.vehicleTransmission = params.transmission;
  if (params.driveWheelConfiguration) json.driveWheelConfiguration = params.driveWheelConfiguration;
  if (params.fuelType) json.fuelType = params.fuelType;
  if (params.color) json.color = params.color;
  if (params.city || params.state) {
    json.areaServed = {
      "@type": "PostalAddress",
      addressLocality: params.city,
      addressRegion: params.state,
      addressCountry: "US",
    };
  }
  return json;
}
