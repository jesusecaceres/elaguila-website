import Link from "next/link";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

function parseListingImageUrls(images: unknown): string[] {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images
      .map((x) => (typeof x === "string" ? x.trim() : typeof x === "object" && x && "url" in x ? String((x as { url?: string }).url ?? "").trim() : ""))
      .filter(Boolean);
  }
  if (typeof images === "string") {
    try {
      return parseListingImageUrls(JSON.parse(images));
    } catch {
      return images.trim() ? [images.trim()] : [];
    }
  }
  return [];
}

function reviewSourceForListing(status: string): string {
  const st = status.toLowerCase();
  if (st === "flagged") {
    return "Review source: listings.status = flagged (no AI/moderation reason column on generic listings)";
  }
  if (st === "pending") {
    return "Review source: listings.status = pending (awaiting staff review)";
  }
  return `Review source: listings.status = ${status || "—"}`;
}

function reviewReasonFallback(status: string): string {
  return "Reason unavailable — inspect review source";
}

type Props = {
  listing: Record<string, unknown>;
  ownerEmail?: string | null;
  ownerName?: string | null;
};

export function AdminListingReviewSnapshot({ listing, ownerEmail, ownerName }: Props) {
  const id = String(listing.id ?? "");
  const title = String(listing.title ?? "").trim() || "(no title)";
  const description = String(listing.description ?? "").trim();
  const city = String(listing.city ?? "").trim();
  const category = String(listing.category ?? "").trim();
  const status = String(listing.status ?? "active");
  const leonixAdId = String(listing.leonix_ad_id ?? "").trim();
  const ownerId = String(listing.owner_id ?? "").trim();
  const price = listing.price != null && typeof listing.price === "number" ? `$${listing.price}` : listing.is_free ? "Free" : "—";
  const isPublished = listing.is_published === true;
  const imageUrls = parseListingImageUrls(listing.images).slice(0, 8);
  const categoryLower = category.toLowerCase();
  const publicHref =
    categoryLower === "rentas" ? rentasListingPublicPath(id) : `/clasificados/anuncio/${encodeURIComponent(id)}`;
  const queueHref = `/admin/workspace/clasificados?q=${encodeURIComponent(leonixAdId || id)}&status=${encodeURIComponent(status.toLowerCase())}#queue`;

  return (
    <section className={`${adminCardBase} space-y-4 p-5`} data-testid="admin-listing-review-snapshot">
      <div>
        <h2 className="text-lg font-bold text-[#1E1810]">Review snapshot</h2>
        <p className="mt-1 text-xs text-[#5C5346]">
          Ad content for moderation — read-only preview. AI/moderation reason field not present on generic listings.
        </p>
      </div>

      <dl className="grid gap-2 text-sm text-[#3D3428]">
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Title</dt>
          <dd className="font-semibold text-[#1E1810] break-words">{title}</dd>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Leonix Ad ID</dt>
            <dd className="font-mono text-xs break-all">{leonixAdId || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Status</dt>
            <dd className="font-semibold">{status}</dd>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Category / source</dt>
            <dd>
              {category || "—"} · <span className="font-mono text-xs">public.listings</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Published</dt>
            <dd>{isPublished ? "Yes (is_published)" : "No / hidden"}</dd>
          </div>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Review / flag source</dt>
          <dd className="text-xs text-[#5C5346]">{reviewSourceForListing(status)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Reason</dt>
          <dd className="text-xs text-[#5C5346]">{reviewReasonFallback(status)}</dd>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">City / price</dt>
            <dd>
              {city || "—"} · {price}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Seller</dt>
            <dd className="break-words text-xs">
              {ownerId ? (
                <Link href={`/admin/usuarios/${ownerId}`} className="font-semibold text-[#6B5B2E] underline">
                  {ownerName?.trim() || "Seller profile"}
                </Link>
              ) : (
                "—"
              )}
              {ownerEmail ? <span className="mt-0.5 block text-[#7A7164]">{ownerEmail}</span> : null}
              {ownerId ? <span className="mt-0.5 block font-mono text-[10px] text-[#9A9084]">{ownerId}</span> : null}
            </dd>
          </div>
        </div>
      </dl>

      <div>
        <h3 className="text-[10px] font-bold uppercase text-[#7A7164]">Description / body</h3>
        {description ? (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-3 text-sm leading-relaxed text-[#1E1810] whitespace-pre-wrap break-words">
            {description}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7A7164]">No description on this listing.</p>
        )}
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase text-[#7A7164]">Images</h3>
        {imageUrls.length > 0 ? (
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {imageUrls.map((url) => (
              <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#E8DFD0] bg-[#FAF7F2]">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only arbitrary seller URLs */}
                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#7A7164]">No images available on this row.</p>
        )}
        <p className="mt-1 text-[10px] text-[#9A9084]">{imageUrls.length} image(s) shown (max 8)</p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#E8DFD0]/80 pt-3">
        <Link
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] items-center rounded-lg border border-[#1E4A7A] bg-[#1E4A7A] px-3 py-2 text-xs font-semibold text-white"
        >
          View public
        </Link>
        <Link
          href={queueHref}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-[#C9782F] bg-[#E8943A] px-3 py-2 text-xs font-semibold text-[#1E1810]"
        >
          Open in queue
        </Link>
      </div>
    </section>
  );
}
