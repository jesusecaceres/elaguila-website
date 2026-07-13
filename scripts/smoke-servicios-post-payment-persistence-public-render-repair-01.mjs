const baseUrl = (process.env.SERVICIOS_SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const slug = "autos-mechanics";
const fixtureId = "ef6977d5-d280-44d4-a986-bf94e371a565";
const fixtureLeonixAdId = "SERV-2026-000102";

async function fetchText(path) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
  const text = await res.text();
  return { res, text };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const results = await fetchText("/clasificados/servicios/resultados?lang=es");
  assert(results.res.ok, `results HTTP ${results.res.status}`);
  assert(results.text.includes(slug) || results.text.includes("Autos Mechanics"), "results must include Autos Mechanics");

  const detail = await fetchText(`/clasificados/servicios/${slug}?lang=es`);
  assert(detail.res.status === 200, `detail HTTP ${detail.res.status}`);
  assert(detail.text.includes("Autos Mechanics"), "detail must include Autos Mechanics");
  assert(
    !/Application error|server-side exception|2085571716/i.test(detail.text),
    "detail must not render server exception page",
  );
  assert(
    detail.text.includes(fixtureLeonixAdId) || detail.text.includes(fixtureId) || detail.text.includes(slug),
    "detail must expose stable listing identity marker",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        slug,
        listingId: fixtureId,
        leonixAdId: fixtureLeonixAdId,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
