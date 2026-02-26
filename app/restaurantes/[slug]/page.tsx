import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../../components/PageHero";
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

export async function generateMetadata(props: { params: Promise<RouteParams> }): Promise<Metadata> {
  const p = await props.params;
  const slug = normalizeSlug(p.slug || "");
  const r = restaurants.find((x) => normalizeSlug(getSlugCandidate({ id: x.id, name: x.name })) === slug);
  return {
    title: r ? `${r.name} | Restaurants | LEONIX` : "Restaurant | LEONIX",
    description: r ? r.text || `Info and contact for ${r.name}.` : "Restaurant details.",
    keywords: ["restaurants", "LEONIX"],
  };
}

export default async function RestaurantPage(props: { params: Promise<RouteParams> }) {
  const p = await props.params;
  const slug = normalizeSlug(p.slug || "");
  const r = restaurants.find((x) => normalizeSlug(getSlugCandidate({ id: x.id, name: x.name })) === slug);

  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero title="Restaurant" titleEs="Restaurante" />

      <section className="w-full max-w-4xl mx-auto px-6 pb-20">
        {!r ? (
          <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8 text-center">
            <div className="text-2xl md:text-3xl font-semibold text-yellow-300">Not found</div>
            <div className="mt-2 text-gray-300">
              This restaurant isn’t in the directory yet — or the link is outdated.
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href="/restaurantes"
                className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
              >
                Back to Restaurants
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">{r.name}</h1>
                <div className="mt-2 text-gray-300">
                  {[r.cuisine, r.city].filter(Boolean).join(" • ")}
                </div>
              </div>
              {r.supporter ? (
                <div className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                  {r.supporter}
                </div>
              ) : null}
            </div>

            {r.address ? <div className="mt-4 text-gray-300">{r.address}</div> : null}
            {r.text ? <div className="mt-4 text-gray-300 whitespace-pre-line">{r.text}</div> : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {r.website ? (
                <a
                  href={r.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                >
                  Website
                </a>
              ) : null}
              {r.googleMapsUrl ? (
                <a
                  href={r.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                >
                  Map
                </a>
              ) : null}
              {r.phone ? (
                <a
                  href={`tel:${r.phone}`}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                >
                  Call
                </a>
              ) : null}
            </div>

            <div className="mt-10">
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
