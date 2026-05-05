import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestaurantePublishableRemoteImageRef } from "./restauranteMediaDisplay";

function isDataImageUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("data:image/");
}

async function uploadBlobForDraft(
  blob: Blob,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  const form = new FormData();
  form.set("draftListingId", ctx.draftListingId);
  form.set("slot", ctx.slot);
  if (ctx.index !== undefined) form.set("index", String(ctx.index));
  form.set("file", blob, "image.jpg");
  const res = await fetch("/api/clasificados/restaurantes/draft-media-upload", {
    method: "POST",
    body: form,
  });
  const j = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string; detail?: string };
  if (!res.ok || !j.ok || typeof j.publicUrl !== "string") {
    const msg = [j.error, j.detail].filter(Boolean).join(": ") || `upload_http_${res.status}`;
    throw new Error(msg);
  }
  return j.publicUrl;
}

async function uploadDataUrlIfNeeded(
  url: string,
  ctx: { draftListingId: string; slot: string; index?: number },
): Promise<string> {
  const t = url.trim();
  if (!isDataImageUrl(t)) return t;
  const res = await fetch(t);
  const blob = await res.blob();
  return uploadBlobForDraft(blob, ctx);
}

/**
 * Replace `data:image/...` entries with HTTPS Blob URLs so `buildRestaurantePublishPayload` + API transport gate succeed.
 * Leaves existing remote URLs unchanged.
 */
export async function resolveRestauranteDraftMediaToRemoteUrls(d: RestauranteListingDraft): Promise<RestauranteListingDraft> {
  const id = d.draftListingId;
  let heroImage = d.heroImage;
  if (typeof heroImage === "string" && heroImage.trim() && !isRestaurantePublishableRemoteImageRef(heroImage)) {
    if (isDataImageUrl(heroImage)) heroImage = await uploadDataUrlIfNeeded(heroImage, { draftListingId: id, slot: "hero" });
  }

  const galleryImages = await Promise.all(
    (d.galleryImages ?? []).map(async (u, i) => {
      if (typeof u !== "string" || !u.trim()) return u;
      if (isRestaurantePublishableRemoteImageRef(u)) return u;
      if (isDataImageUrl(u)) return uploadDataUrlIfNeeded(u, { draftListingId: id, slot: "gallery", index: i });
      return u;
    }),
  );

  const mapBucket = async (arr: string[] | undefined, slot: "food" | "interior" | "exterior") => {
    const list = arr ?? [];
    return Promise.all(
      list.map(async (u, i) => {
        if (typeof u !== "string" || !u.trim()) return u;
        if (isRestaurantePublishableRemoteImageRef(u)) return u;
        if (isDataImageUrl(u)) return uploadDataUrlIfNeeded(u, { draftListingId: id, slot, index: i });
        return u;
      }),
    );
  };

  const foodImages = await mapBucket(d.foodImages, "food");
  const interiorImages = await mapBucket(d.interiorImages, "interior");
  const exteriorImages = await mapBucket(d.exteriorImages, "exterior");

  const featuredDishes = await Promise.all(
    (d.featuredDishes ?? []).map(async (row, i) => {
      const img = row.image;
      if (typeof img !== "string" || !img.trim()) return row;
      if (isRestaurantePublishableRemoteImageRef(img)) return row;
      if (isDataImageUrl(img)) {
        const next = await uploadDataUrlIfNeeded(img, { draftListingId: id, slot: "featured", index: i });
        return { ...row, image: next };
      }
      return row;
    }),
  );

  let businessLogo = d.businessLogo;
  if (typeof businessLogo === "string" && businessLogo.trim() && !isRestaurantePublishableRemoteImageRef(businessLogo)) {
    if (isDataImageUrl(businessLogo)) {
      businessLogo = await uploadDataUrlIfNeeded(businessLogo, { draftListingId: id, slot: "logo" });
    }
  }

  return {
    ...d,
    heroImage,
    galleryImages,
    foodImages,
    interiorImages,
    exteriorImages,
    featuredDishes,
    businessLogo,
  };
}
