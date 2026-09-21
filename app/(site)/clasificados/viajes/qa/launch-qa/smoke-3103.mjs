const base = "http://127.0.0.1:3103";
const paths = [
  "/clasificados/viajes",
  "/clasificados/viajes/resultados",
  "/clasificados/viajes/resultados?lang=es&q=cancun&budget=economico",
  "/clasificados/viajes/resultados?lang=es&sort=newest",
  "/clasificados/viajes/resultados?lang=es&sort=priceAsc",
  "/clasificados/viajes/resultados?lang=es&sort=priceDesc",
  "/clasificados/viajes/resultados?lang=es&q=__no_match_empty_state_qa__",
  "/publicar/viajes/negocios",
  "/publicar/viajes/privado",
  "/clasificados/viajes/preview/negocios",
  "/dashboard/viajes",
  "/admin/viajes",
];

for (const p of paths) {
  try {
    const res = await fetch(base + p, { redirect: "manual" });
    console.log(`${res.status} ${p}`);
  } catch (e) {
    console.log(`ERR ${p} :: ${e instanceof Error ? e.message : e}`);
  }
}

const results = await fetch(`${base}/clasificados/viajes/resultados?lang=es&sort=newest`);
const html = await results.text();
const offer = html.match(/\/clasificados\/viajes\/oferta\/([a-z0-9\-]+)/);
const provider = html.match(/\/clasificados\/viajes\/negocio\/([a-z0-9\-]+)/);
if (offer) {
  const r = await fetch(`${base}/clasificados/viajes/oferta/${offer[1]}?lang=es`);
  console.log(`${r.status} /clasificados/viajes/oferta/${offer[1]}`);
} else {
  console.log("NO_OFFER_SLUG");
}
if (provider) {
  const r = await fetch(`${base}/clasificados/viajes/negocio/${provider[1]}?lang=es`);
  console.log(`${r.status} /clasificados/viajes/negocio/${provider[1]}`);
} else {
  console.log("NO_PROVIDER_SLUG");
}
