"use client";

import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "../../data/restaurants";

type Lang = "es" | "en";

type PraiseReview = {
  id: string;
  name: string;
  rating: number; // 1..5
  text: string;
  praiseTags: string[];
  createdAt: string; // ISO
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampRating(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return Math.round(n * 10) / 10;
}

function formatRating(n: number) {
  const r = clampRating(n);
  const s = r.toFixed(r % 1 === 0 ? 0 : 1);
  return s;
}

function formatDateLabel(iso: string, lang: Lang) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return lang === "es" ? "Reciente" : "Recently";
  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 60) return lang === "es" ? `Hace ${diffMin} min` : `${diffMin} min ago`;
  if (diffHr < 24) return lang === "es" ? `Hace ${diffHr} h` : `${diffHr}h ago`;
  if (diffDay < 7) return lang === "es" ? `Hace ${diffDay} días` : `${diffDay}d ago`;
  return d.toLocaleDateString(lang === "es" ? "es-US" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const star = (k: string, filled: boolean) => (
    <span key={k} className={filled ? "text-yellow-300" : "text-white/20"} aria-hidden="true">
      ★
    </span>
  );

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${formatRating(v)} out of 5`}>
      {Array.from({ length: full }).map((_, i) => star(`f${i}`, true))}
      {half ? star("h", true) : null}
      {Array.from({ length: empty }).map((_, i) => star(`e${i}`, false))}
    </span>
  );
}

function storageKey(restaurantId: string) {
  return `leonix_rest_reviews_v1_${restaurantId}`;
}

function safeParseReviews(raw: string | null): PraiseReview[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .map((x: any) => ({
        id: String(x?.id || ""),
        name: String(x?.name || "").slice(0, 60),
        rating: Number(x?.rating || 0),
        text: String(x?.text || "").slice(0, 800),
        praiseTags: Array.isArray(x?.praiseTags) ? x.praiseTags.map((t: any) => String(t).slice(0, 32)).filter(Boolean) : [],
        createdAt: String(x?.createdAt || ""),
      }))
      .filter((x: PraiseReview) => x.id && Number.isFinite(x.rating));
  } catch {
    return [];
  }
}

function saveReviews(restaurantId: string, reviews: PraiseReview[]) {
  try {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(reviews));
  } catch {
    // ignore
  }
}

function defaultPraiseOptions(lang: Lang) {
  // Praise-first: simple, positive, deal-closing signals
  return lang === "es"
    ? ["Sabor", "Servicio", "Porciones", "Precio", "Limpio", "Rápido", "Familiar", "Ambiente", "Auténtico", "Recomendado"]
    : ["Flavor", "Service", "Portions", "Value", "Clean", "Fast", "Family", "Vibe", "Authentic", "Recommended"];
}

export default function ReviewsPanel({ restaurant, lang }: { restaurant: Restaurant; lang: Lang }) {
  const [reviews, setReviews] = useState<PraiseReview[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const options = useMemo(() => defaultPraiseOptions(lang), [lang]);

  useEffect(() => {
    const loaded = safeParseReviews(localStorage.getItem(storageKey(restaurant.id)));
    setReviews(loaded);
  }, [restaurant.id]);

  const stats = useMemo(() => {
    const all = reviews;
    const count = all.length;
    const avg = count ? all.reduce((a, r) => a + (Number(r.rating) || 0), 0) / count : 0;
    const recommend = count ? (all.filter((r) => (Number(r.rating) || 0) >= 4).length / count) * 100 : 0;

    const freq = new Map<string, number>();
    for (const r of all) {
      for (const t of r.praiseTags || []) {
        const key = String(t || "").trim();
        if (!key) continue;
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }
    const topMentions = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k]) => k);

    return {
      ratingCount: count,
      ratingAvg: count ? clampRating(avg) : restaurant.reviewSummary?.ratingAvg || 0,
      recommendPct: count ? Math.round(recommend) : restaurant.reviewSummary?.recommendPct,
      topMentions: topMentions.length ? topMentions : restaurant.reviewSummary?.topMentions || [],
      hasReal: count > 0,
    };
  }, [reviews, restaurant.reviewSummary]);

  function toggleTag(tag: string) {
    const t = tag.trim();
    if (!t) return;
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 6)));
  }

  function addCustomTag() {
    const t = customTag.trim().slice(0, 32);
    if (!t) return;
    setCustomTag("");
    setSelectedTags((prev) => (prev.includes(t) ? prev : [...prev, t].slice(0, 6)));
  }

  function submit() {
    const n = name.trim().slice(0, 60) || (lang === "es" ? "Anónimo" : "Anonymous");
    const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const body = text.trim().slice(0, 800);
    const tags = selectedTags.slice(0, 6);

    // Praise-first: require at least one praise tag OR a short text.
    if (!tags.length && body.length < 10) return;

    const next: PraiseReview = {
      id: `${restaurant.id}_${Date.now()}`,
      name: n,
      rating: r,
      text: body,
      praiseTags: tags,
      createdAt: new Date().toISOString(),
    };

    const updated = [next, ...reviews].slice(0, 50);
    setReviews(updated);
    saveReviews(restaurant.id, updated);

    // reset
    setText("");
    setSelectedTags([]);
  }

  const labels = useMemo(() => {
    const isEs = lang === "es";
    return {
      title: isEs ? "Reseñas" : "Reviews",
      subtitle: isEs ? "Primero: qué fue lo mejor. Esto ayuda a la comunidad a decidir rápido." : "First: what was best. Helps the community decide fast.",
      addTitle: isEs ? "Deja una reseña (rápido)" : "Leave a review (quick)",
      name: isEs ? "Tu nombre" : "Your name",
      praise: isEs ? "¿Qué te gustó?" : "What did you love?",
      note: isEs ? "Comentario (opcional)" : "Comment (optional)",
      button: isEs ? "Publicar reseña" : "Post review",
      helper: isEs ? "Tip: selecciona 1–3 elogios. Eso pesa más que escribir mucho." : "Tip: pick 1–3 praise tags. That matters more than long text.",
      readOnly: isEs ? "Local (demo)" : "Local (demo)",
      rating: isEs ? "Calificación" : "Rating",
      recommended: isEs ? "Recomendado" : "Recommended",
      wouldReturn: isEs ? "Volverían" : "Would return",
      topMentions: isEs ? "Elogios principales" : "Top praise",
      noneYet: isEs ? "Aún no hay reseñas." : "No reviews yet.",
    };
  }, [lang]);

  return (
    <div className="grid gap-4">
      {/* Add review */}
      <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-100">{labels.addTitle}</div>
            <div className="mt-1 text-sm text-gray-300">{labels.helper}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">{labels.readOnly}</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <div className="text-xs text-gray-400">{labels.name}</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40"
              placeholder={lang === "es" ? "Opcional" : "Optional"}
            />
          </label>

          <label className="block">
            <div className="text-xs text-gray-400">{labels.rating}</div>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 outline-none focus:border-yellow-500/40"
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="block">
            <div className="text-xs text-gray-400">{lang === "es" ? "Etiqueta personalizada" : "Custom tag"}</div>
            <div className="mt-1 flex gap-2">
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40"
                placeholder={lang === "es" ? "Ej: salsa, brunch…" : "Ex: salsa, brunch…"}
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-400">{labels.praise}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cx(
                    "text-xs px-3 py-1.5 rounded-xl border transition",
                    active
                      ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-200"
                      : "bg-white/5 border-white/10 text-gray-100 hover:bg-white/10"
                  )}
                >
                  {t}
                </button>
              );
            })}
            {selectedTags
              .filter((t) => !options.includes(t))
              .map((t) => {
                const active = selectedTags.includes(t);
                return (
                  <button
                    key={`c-${t}`}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cx(
                      "text-xs px-3 py-1.5 rounded-xl border transition",
                      active
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-200"
                        : "bg-white/5 border-white/10 text-gray-100 hover:bg-white/10"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-400">{labels.note}</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40 min-h-[88px]"
            placeholder={lang === "es" ? "Opcional… (mínimo 10 caracteres si no eliges elogios)" : "Optional… (min 10 chars if no tags)"}
          />
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={submit}
            className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
          >
            {labels.button}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-100">{labels.title}</div>
            <div className="mt-1 text-sm text-gray-300">{labels.subtitle}</div>
          </div>

          {restaurant.verified ? (
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">✅ Verified</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
              {lang === "es" ? "Perfil nuevo" : "New profile"}
            </span>
          )}
        </div>

        {stats.ratingCount > 0 ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
              <div className="text-sm text-gray-300">{labels.rating}</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-2xl font-semibold text-gray-100">{formatRating(stats.ratingAvg)}</div>
                <Stars value={stats.ratingAvg} />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {stats.ratingCount} {lang === "es" ? "reseña" : "review"}
                {stats.ratingCount === 1 ? "" : "s"}
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
              <div className="text-sm text-gray-300">{labels.recommended}</div>
              <div className="mt-2 text-2xl font-semibold text-gray-100">
                {stats.recommendPct == null ? "—" : `${Math.round(stats.recommendPct)}%`}
              </div>
              <div className="mt-1 text-xs text-gray-400">{labels.wouldReturn}</div>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
              <div className="text-sm text-gray-300">{labels.topMentions}</div>
              {stats.topMentions.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {stats.topMentions.slice(0, 6).map((m) => (
                    <span key={m} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">{lang === "es" ? "Aparecerán cuando lleguen reseñas." : "Will appear as reviews come in."}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-black/40 border border-white/10 p-5">
            <div className="text-gray-100 font-semibold">{labels.noneYet}</div>
            <div className="mt-1 text-gray-300 text-sm">
              {lang === "es"
                ? "Este perfil está listo. Cuando la comunidad deje reseñas, verás el resumen aquí."
                : "This profile is ready. As the community leaves feedback, you’ll see a summary here."}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-100">{lang === "es" ? "Comentarios" : "Comments"}</div>
            <div className="mt-1 text-sm text-gray-300">
              {reviews.length ? (lang === "es" ? "Mostrando reseñas locales (demo)." : "Showing local reviews (demo).") : (lang === "es" ? "Aún no hay reseñas reales (demo)." : "No real reviews yet (demo).")}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">{labels.readOnly}</span>
        </div>

        <div className="mt-4 space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-100">{r.name}</div>
                <div className="text-xs text-gray-400">{formatDateLabel(r.createdAt, lang)}</div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-sm text-gray-300">{clampRating(r.rating)}</span>
              </div>

              {r.praiseTags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.praiseTags.slice(0, 6).map((t) => (
                    <span key={`${r.id}-${t}`} className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              {r.text ? <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{r.text}</div> : null}
            </div>
          ))}

          {!reviews.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-300">
              {lang === "es" ? "Sé el primero en dejar un elogio arriba." : "Be the first to leave praise above."}
            </div>
          ) : null}
        </div>

        <div className="mt-5 text-xs text-gray-400">
          {lang === "es"
            ? "Próximo: reseñas verificadas, fotos y respuestas del negocio."
            : "Next: verified reviews, photos, and business replies."}
        </div>
      </div>
    </div>
  );
}
