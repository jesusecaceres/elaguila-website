import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import ContactActions from "../../clasificados/components/ContactActions";
import ReviewsPanel from "../components/ReviewsPanel";
import SpecialsCard from "../components/SpecialsCard";
import FavoriteButton from "../components/FavoriteButton";
import LeadCaptureCard from "../components/LeadCaptureCard";
import ShareMapBar from "../components/ShareMapBar";
import { restaurants } from "../../data/restaurants";
function safeImageUrl(raw: string): string | null {
  const u = String(raw || "").trim();
  if (!u) return null;
  // Block dangerous schemes
  const lower = u.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  // Allow absolute http(s) or relative (/...) URLs
  if (lower.startsWith("http://") || lower.startsWith("https://") || u.startsWith("/")) return u;
  return null;
}

type RouteParams = { slug: string };

function normalizeSlug(s: string) {
  return s.trim().toLowerCase();
}

function getSlugCandidate(r: { id: string; name: string }) {
  const base = r.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${base}-${r.id}`;
}

function formatPhoneForTel(phone: string) {
  return phone.replace(/[^0-9+]/g, "");
}

function safeExternal(url: string) {
  // allow http(s) only; anything else returns empty to avoid broken links
  const u = url.trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

export async function generateMetadata(props: { params: Promise<RouteParams> }): Promise<Metadata> {
  const p = await props.params;
  const slug = normalizeSlug(p.slug || "");
  const r = restaurants.find((x) => normalizeSlug(getSlugCandidate({ id: x.id, name: x.name })) === slug);

const nearby = (restaurants || [])
  .filter((x) => x && x.id !== r?.id)
  .filter((x) => {
    // Prefer same-city recs when possible; otherwise allow any.
    const cityA = String((x as any).city || "").trim().toLowerCase();
    const cityB = String((r as any)?.city || "").trim().toLowerCase();
    return cityB ? cityA === cityB : true;
  })
  .slice(0, 6)
  .map((x) => ({
    id: (x as any).id,
    name: (x as any).name,
    city: (x as any).city,
    cuisine: (x as any).cuisine,
    price: (x as any).price,
    photo: Array.isArray((x as any).photos) ? safeImageUrl(String((x as any).photos[0] || "")) : null,
    href: `/restaurantes/${normalizeSlug(getSlugCandidate({ id: (x as any).id, name: (x as any).name }))}`,
    supporter: (x as any).supporter,
  }));
  return {
    title: r ? `${r.name} | Restaurantes | LEONIX` : "Restaurante | LEONIX",
    description: r ? r.text || `Info y contacto de ${r.name}.` : "Detalles del restaurante.",
    keywords: ["restaurantes", "LEONIX", "comida"],
  };
}

export default async function RestaurantPage(props: { params: Promise<RouteParams> }) {
  const p = await props.params;
  const slug = normalizeSlug(p.slug || "");
  const r = restaurants.find((x) => normalizeSlug(getSlugCandidate({ id: x.id, name: x.name })) === slug);

const nearby = (restaurants || [])
  .filter((x) => x && x.id !== r?.id)
  .filter((x) => {
    // Prefer same-city recs when possible; otherwise allow any.
    const cityA = String((x as any).city || "").trim().toLowerCase();
    const cityB = String((r as any)?.city || "").trim().toLowerCase();
    return cityB ? cityA === cityB : true;
  })
  .slice(0, 6)
  .map((x) => ({
    id: (x as any).id,
    name: (x as any).name,
    city: (x as any).city,
    cuisine: (x as any).cuisine,
    price: (x as any).price,
    photo: Array.isArray((x as any).photos) ? safeImageUrl(String((x as any).photos[0] || "")) : null,
    href: `/restaurantes/${normalizeSlug(getSlugCandidate({ id: (x as any).id, name: (x as any).name }))}`,
    supporter: (x as any).supporter,
  }));

  const website = r?.website ? safeExternal(r.website) : "";
  const menuUrl = (r as any)?.menuUrl ? safeExternal((r as any).menuUrl) : "";
  const mapsUrl = r?.googleMapsUrl ? safeExternal(r.googleMapsUrl) : "";
  const couponsUrl = r?.couponsUrl ? safeExternal(r.couponsUrl) : "";
  const instagram = r?.instagram ? safeExternal(r.instagram) : "";
  const facebook = r?.facebook ? safeExternal(r.facebook) : "";
  const phoneTel = r?.phone ? formatPhoneForTel(r.phone) : "";

  const metaLine = [r?.cuisine, r?.price, r?.city].filter(Boolean).join(" • ");

  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero title="Restaurants" titleEs="Restaurantes" />

      <section className="w-full max-w-5xl mx-auto px-6 pb-20">
        {!r ? (
          <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8 text-center">
            <div className="text-2xl md:text-3xl font-semibold text-yellow-300">No encontrado</div>
            <div className="mt-2 text-gray-300">
              Este restaurante no está en el directorio todavía — o el enlace ya no es válido.
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href="/restaurantes"
                className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
              >
                Volver a Restaurantes
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Header card */}
            <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">{r.name}</h1>
                  {metaLine ? <div className="mt-2 text-gray-300">{metaLine}</div> : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.verified ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">
                        ✅ Verified
                      </span>
                    ) : null}
                    {r.supporter ? (
                      <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                        {r.supporter}
                      </span>
                    ) : null}
                    <FavoriteButton id={r.id} lang="es" size="sm" />
                    {(r.tags || []).slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <ContactActions
                    lang="en"
                    phone={r.phone}
                    text={r.text}
                    email={r.email}
                    mapsUrl={mapsUrl}
                    website={r.website}
                  />

                  {menuUrl ? (
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Menu
                    </a>
                  ) : website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Website
                    </a>
                  ) : null}
                  {couponsUrl ? (
                    <a
                      href={couponsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Coupons
                    </a>
                  ) : null}
                </div>
              </div>

              {r.address ? <div className="mt-4 text-gray-300">{r.address}</div> : null}
              {r.text ? <div className="mt-4 text-gray-300 whitespace-pre-line">{r.text}</div> : null}
            </div>

            <SpecialsCard lang="es" isSupporter={Boolean(r.supporter)} />

            <ReviewsPanel restaurant={r} lang="es" />

            <LeadCaptureCard restaurantName={r.name} email={r.email} phone={r.phone} />


                        {/* Info grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
                <div className="text-lg font-semibold text-gray-100">Contact</div>
                <div className="mt-3 space-y-2 text-gray-300">
                  {r.phone ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-gray-400">Phone</div>
                      <div className="text-gray-200">{r.phone}</div>
                    </div>
                  ) : null}
                  {r.email ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-gray-400">Email</div>
                      <a href={`mailto:${r.email}`} className="text-gray-200 hover:underline">{r.email}</a>
                    </div>
                  ) : null}
                  {r.address ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-gray-400">Address</div>
                      <div className="text-gray-200 text-right">{r.address}</div>
                    </div>
                  ) : null}

                  {!r.phone && !r.email && !r.address ? (
                    <div className="text-gray-400">Contact details coming soon.</div>
                  ) : null}
                </div>

                <ShareMapBar name={r.name} address={r.address} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Website
                    </a>
                  ) : null}
                  {instagram ? (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Instagram
                    </a>
                  ) : null}
                  {facebook ? (
                    <a
                      href={facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Facebook
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
                <div className="text-lg font-semibold text-gray-100">Hours</div>
                <div className="mt-3 text-gray-300">
                  {(r as any)?.hoursNote ? (
                    <div className="whitespace-pre-line">{(r as any).hoursNote}</div>
                  ) : (
                    <div className="text-gray-400">
                      Hours will appear here once the business confirms them.
                    </div>
                  )}
                </div>

                <div className="mt-6 text-lg font-semibold text-gray-100">Trust</div>
                <div className="mt-3 text-gray-300">
                  {r.verified ? (
                    <div className="text-gray-200">
                      Verified listing — identity and business details confirmed by LEONIX.
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      This listing is not verified yet. Verified restaurants appear with a ✅ badge.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photos */}
            {(r as any)?.photos && Array.isArray((r as any).photos) && (r as any).photos.length ? (
              <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-gray-100">Photos</div>
                  <div className="text-sm text-gray-400">{(r as any).photos.length}+</div>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {(r as any).photos
                    .map((u: string) => safeImageUrl(String(u || "")))
                    .filter(Boolean)
                    .slice(0, 12)
                    .map((u: string) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={u}
                        src={u}
                        alt={`${r.name} photo`}
                        loading="lazy"
                        className="h-28 w-40 md:h-32 md:w-48 object-cover rounded-xl border border-white/10 bg-white/5 flex-shrink-0"
                      />
                    ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Tip: real photos help families decide faster — we&apos;ll keep this section clean and spam-free.
                </div>
              </div>
            ) : null}

            {/* Menu + popular items */}
            {menuUrl || ((r as any)?.popularItems && Array.isArray((r as any).popularItems) && (r as any).popularItems.length) ? (
              <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-gray-100">Menu &amp; Popular Items</div>
                  {menuUrl ? (
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      View Menu
                    </a>
                  ) : null}
                </div>

                {(r as any)?.popularItems && Array.isArray((r as any).popularItems) && (r as any).popularItems.length ? (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400">Popular right now</div>
                    <ul className="mt-3 space-y-2">
                      {(r as any).popularItems.slice(0, 8).map((it: any) => (
                        <li
                          key={`${it?.name || "item"}-${it?.price || ""}`}
                          className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-gray-100 truncate">{String(it?.name || "Item")}</div>
                            {it?.note ? <div className="text-xs text-gray-400 mt-0.5">{String(it.note)}</div> : null}
                          </div>
                          {it?.price ? (
                            <div className="text-sm text-gray-200 whitespace-nowrap">{String(it.price)}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-400">
                    Menu details coming soon — restaurants will be able to update this themselves.
                  </div>
                )}
              </div>
            ) : null}

            {/* Highlights */}
            {(r as any)?.highlights && Array.isArray((r as any).highlights) && (r as any).highlights.length ? (
              <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
                <div className="text-lg font-semibold text-gray-100">Why people go here</div>
                <ul className="mt-3 space-y-2 text-gray-300 list-disc pl-5">
                  {(r as any).highlights.slice(0, 6).map((h: string) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Reviews (scaffold) */}
            <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
              <div className="text-lg font-semibold text-gray-100">Community Reviews</div>
              <div className="mt-2 text-gray-400">
                Reviews are coming soon — LEONIX will keep this section clean, spam-free, and helpful.
              </div>
            </div>

            <div className="pt-4">
              <Link href="/restaurantes" className="text-yellow-300 hover:text-yellow-200">
                ← Back to Restaurants
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
