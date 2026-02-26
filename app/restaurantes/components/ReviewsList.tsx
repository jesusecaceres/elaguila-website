import type { Restaurant } from "../../data/restaurants";

type Review = {
  id: string;
  name: string;
  rating: number;
  dateLabel: string;
  text: string;
};

function clampRating(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return Math.round(n * 10) / 10;
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
    <span className="inline-flex items-center gap-0.5" aria-label={`${clampRating(v)} de 5`}>
      {Array.from({ length: full }).map((_, i) => star(`f${i}`, true))}
      {half ? star("h", true) : null}
      {Array.from({ length: empty }).map((_, i) => star(`e${i}`, false))}
    </span>
  );
}

function buildDemoReviews(restaurant: Restaurant): Review[] {
  const mentions = (restaurant.reviewSummary?.topMentions || []).slice(0, 5);
  const base = clampRating(restaurant.reviewSummary?.ratingAvg || 4.6);

  const m1 = mentions[0] || "servicio";
  const m2 = mentions[1] || "sabor";
  const m3 = mentions[2] || "porciones";

  const texts = [
    `Excelente experiencia. El ${m1} fue rápido y el ${m2} estuvo al 100%.`,
    `Muy recomendado. Buen ${m2} y buen ambiente. Volvería sin pensarlo.`,
    `Buena relación calidad-precio. Me gustó el ${m3} y la atención fue amable.`,
  ];

  const names = ["M. García", "A. López", "C. Hernández"];
  const dates = ["Hace 2 días", "Hace 1 semana", "Hace 3 semanas"];

  return [0, 1, 2].map((i) => ({
    id: `${restaurant.id}-demo-${i}`,
    name: names[i],
    rating: Math.max(3.5, Math.min(5, base - (i === 2 ? 0.3 : 0))),
    dateLabel: dates[i],
    text: texts[i],
  }));
}

export default function ReviewsList({ restaurant }: { restaurant: Restaurant }) {
  const ratingCount = restaurant.reviewSummary?.ratingCount || 0;
  const reviews = buildDemoReviews(restaurant);

  return (
    <div className="mt-6 bg-black/30 border border-yellow-600/20 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-100">Reseñas</div>
          <div className="mt-1 text-sm text-gray-300">
            {ratingCount > 0 ? "Mostrando ejemplos (modo demo)." : "Aún no hay reseñas reales. (modo demo)"}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-100">
          Solo lectura
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-100">{r.name}</div>
              <div className="text-xs text-gray-400">{r.dateLabel}</div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Stars value={r.rating} />
              <span className="text-sm text-gray-300">{clampRating(r.rating)}</span>
            </div>
            <div className="mt-2 text-sm text-gray-300">{r.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-xs text-gray-400">
        Próximo: reseñas verificadas, fotos y respuestas del negocio.
      </div>
    </div>
  );
}
