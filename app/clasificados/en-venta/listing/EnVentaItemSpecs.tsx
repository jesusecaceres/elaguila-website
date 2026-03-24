"use client";

type Lang = "es" | "en";

export function EnVentaItemSpecs({
  lang,
  rows,
}: {
  lang: Lang;
  rows: Array<{ label: string; value: string }>;
}) {
  const filtered = rows.filter((r) => r.label && r.value && !/^leonix:/i.test(r.label));
  if (!filtered.length) return null;
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4">
      <h2 className="text-sm font-bold text-[#111111]">{lang === "es" ? "Detalles" : "Details"}</h2>
      <dl className="mt-3 divide-y divide-black/10 text-sm">
        {filtered.map((r) => (
          <div key={r.label + r.value} className="flex justify-between gap-4 py-2">
            <dt className="text-[#111111]/60">{r.label}</dt>
            <dd className="max-w-[60%] text-right font-medium text-[#111111]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
