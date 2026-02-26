import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../../components/PageHero";
import ReviewSummaryCard from "../components/ReviewSummaryCard";
import { restaurants } from "../../data/restaurants";

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
                  {phoneTel ? (
                    <a
                      href={`tel:${phoneTel}`}
                      className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
                    >
                      Call
                    </a>
                  ) : null}
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                    >
                      Directions
                    </a>
                  ) : null}
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

            <ReviewSummaryCard restaurant={r} />

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
                      <div className="text-gray-200">{r.email}</div>
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
