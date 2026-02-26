import type { Restaurant } from "../../data/restaurants";

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function formatRating(n: number) {
  if (!Number.isFinite(n)) return "";
  const r = Math.round(n * 10) / 10;
  return r.toFixed(r % 1 === 0 ? 0 : 1);
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const star = (k: string, filled: boolean) => (
    <span
      key={k}
      className={filled ? "text-yellow-300" : "text-white/20"}
      aria-hidden="true"
    >
      ★
    </span>
  );

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${formatRating(v) || "0"} out of 5`}>
      {Array.from({ length: full }).map((_, i) => star(`f${i}`, true))}
      {half ? star("h", true) : null}
      {Array.from({ length: empty }).map((_, i) => star(`e${i}`, false))}
    </span>
  );
}

export default function ReviewSummaryCard({ restaurant }: { restaurant: Restaurant }) {
  const summary = restaurant.reviewSummary;
  const ratingCount = summary?.ratingCount || 0;
  const ratingAvg = summary?.ratingAvg || 0;
  const recommendPct = summary?.recommendPct;

  const mentions = (summary?.topMentions || []).slice(0, 5);

  return (
    <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-100">Review Summary</div>
          <div className="mt-1 text-sm text-gray-300">
            Based on community feedback. We prioritize real, local experiences.
          </div>
        </div>

        {restaurant.verified ? (
          <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">
            ✅ Verified
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
            New profile
          </span>
        )}
      </div>

      {ratingCount > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
            <div className="text-sm text-gray-300">Rating</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="text-2xl font-semibold text-gray-100">{formatRating(ratingAvg)}</div>
              <Stars value={ratingAvg} />
            </div>
            <div className="mt-1 text-xs text-gray-400">{ratingCount} review{ratingCount === 1 ? "" : "s"}</div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
            <div className="text-sm text-gray-300">Recommended</div>
            <div className="mt-2 text-2xl font-semibold text-gray-100">
              {recommendPct == null ? "—" : `${clampPct(recommendPct)}%`}
            </div>
            <div className="mt-1 text-xs text-gray-400">Would visit again</div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
            <div className="text-sm text-gray-300">Top mentions</div>
            {mentions.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {mentions.map((m) => (
                  <span key={m} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-400">Highlights will appear as reviews come in.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-black/40 border border-white/10 p-5">
          <div className="text-gray-100 font-semibold">No reviews yet.</div>
          <div className="mt-1 text-gray-300 text-sm">
            This listing is live and placeholder-safe. As people leave feedback, you’ll see a real summary here.
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Tip: Verified restaurants can request profile updates and publish accurate contact info.
          </div>
        </div>
      )}
    </div>
  );
}
