import Image from "next/image";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { meaningfulReviews } from "../lib/serviciosProfileSanitize";
import { hasReviewsSectionResolved } from "../lib/serviciosProfilePresence";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { SV } from "./serviciosDesignTokens";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function ServiciosReviews({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  if (!hasReviewsSectionResolved(profile)) return null;

  const reviews = meaningfulReviews(profile.reviews);
  const rating = profile.hero.rating;
  const count = profile.hero.reviewCount;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.reviews}</h2>

      {rating != null && count != null ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-black/[0.06] pb-5">
          <ServiciosStarRating value={rating} />
          <span className="text-sm font-semibold">{L.reviewsSummary(rating, count)}</span>
        </div>
      ) : null}

      <ul className="mt-5 space-y-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="flex gap-4 rounded-xl border border-black/[0.05] bg-[color:var(--lx-section)]/80 p-4"
          >
            {r.avatarUrl ? (
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-black/[0.08]">
                <Image src={r.avatarUrl} alt="" fill className="object-cover" sizes="44px" />
              </div>
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-xs font-bold text-[#3B66AD]"
                style={{ background: "rgba(59, 102, 173, 0.12)" }}
              >
                {initials(r.authorName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[color:var(--lx-text)]">{r.authorName}</p>
              {r.rating != null ? (
                <div className="mt-1">
                  <ServiciosStarRating value={r.rating} size="sm" />
                </div>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-muted)]">&ldquo;{r.quote}&rdquo;</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
