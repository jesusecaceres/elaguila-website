import type { Metadata } from "next";
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";

/** Structural subset so both the resolved profile and the stored wire profile_json qualify. */
type ServiciosSocialImageSource = {
  hero?: Partial<Pick<ServiciosBusinessProfile["hero"], "coverImageUrl" | "coverImageAlt" | "logoUrl" | "logoAlt">> | null;
  gallery?: ReadonlyArray<{ url?: string | null; alt?: string | null }> | null;
};

function usableImageUrl(raw: string | null | undefined): string | undefined {
  const u = (raw ?? "").trim();
  if (!u) return undefined;
  if (/^https:\/\//i.test(u) || u.startsWith("/")) return u;
  return undefined;
}

/**
 * The listing's own public hero image for social unfurls: cover first, then the first gallery
 * image, then the business logo. Undefined when the listing has no public media (text-only card).
 */
export function serviciosSocialImage(profile: ServiciosSocialImageSource): { url: string; alt: string } | undefined {
  const cover = usableImageUrl(profile.hero?.coverImageUrl);
  if (cover) return { url: cover, alt: profile.hero?.coverImageAlt?.trim() || "" };
  const first = profile.gallery?.find((g) => usableImageUrl(g?.url));
  if (first) return { url: usableImageUrl(first.url)!, alt: first.alt?.trim() || "" };
  const logo = usableImageUrl(profile.hero?.logoUrl);
  if (logo) return { url: logo, alt: profile.hero?.logoAlt?.trim() || "" };
  return undefined;
}

/** OpenGraph + Twitter card for a published Servicios listing (listing-specific title/image). */
export function serviciosSocialCards(input: {
  title: string;
  description?: string;
  canonicalPath: string;
  image?: { url: string; alt: string };
}): Pick<Metadata, "openGraph" | "twitter"> {
  const alt = input.image?.alt || input.title;
  return {
    openGraph: {
      title: input.title,
      description: input.description,
      type: "website",
      url: input.canonicalPath,
      images: input.image ? [{ url: input.image.url, alt }] : undefined,
    },
    twitter: {
      card: input.image ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images: input.image ? [input.image.url] : undefined,
    },
  };
}
