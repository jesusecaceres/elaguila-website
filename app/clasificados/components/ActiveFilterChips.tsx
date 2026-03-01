"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function prettyRadius(mi: string) {
  const n = Number(mi);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n} mi`;
}


function prettyKeyLabel(key: string, lang: Lang): string {
  const es: Record<string, string> = {
    rpmin: "Precio mín.",
    rpmax: "Precio máx.",
    rbeds: "Recámaras",
    rbaths: "Baños",
    rtype: "Tipo",
    rpets: "Mascotas",
    rparking: "Estacionamiento",
    rfurnished: "Amueblado",
    rutilities: "Servicios",
    ravailable: "Disponible",
    rsqmin: "m² mín.",
    rsqmax: "m² máx.",
    rleaseterm: "Contrato",
    rseller: "Publicado por",

    aymin: "Año mín.",
    aymax: "Año máx.",
    amake: "Marca",
    amodel: "Modelo",
    amilesmax: "Millas máx.",
    acond: "Condición",
    aseller: "Vendedor",

    ejob: "Tipo de trabajo",
    eremote: "Modalidad",
    epaymin: "Pago mín.",
    epaymax: "Pago máx.",
    eindustry: "Industria",

    stype: "Tipo de servicio",
    savail: "Horario",
    svisit: "Servicio",

    vpmin: "Precio mín.",
    vpmax: "Precio máx.",
    vtype: "Tipo",
    vcond: "Condición",
    vneg: "Negociable",

    csub: "Materia",
    clevel: "Nivel",
    cmode: "Modalidad",
    gtype: "Tipo",
    ttype: "Tipo de viaje",
    tbmin: "Presupuesto mín.",
    tbmax: "Presupuesto máx.",
  };

  const en: Record<string, string> = {
    rpmin: "Min price",
    rpmax: "Max price",
    rbeds: "Beds",
    rbaths: "Baths",
    rtype: "Type",
    rpets: "Pets",
    rparking: "Parking",
    rfurnished: "Furnished",
    rutilities: "Utilities",
    ravailable: "Available",
    rsqmin: "Min sqft",
    rsqmax: "Max sqft",
    rleaseterm: "Lease term",
    rseller: "Posted by",

    aymin: "Min year",
    aymax: "Max year",
    amake: "Make",
    amodel: "Model",
    amilesmax: "Max miles",
    acond: "Condition",
    aseller: "Seller",

    ejob: "Job type",
    eremote: "Work mode",
    epaymin: "Min pay",
    epaymax: "Max pay",
    eindustry: "Industry",

    stype: "Service type",
    savail: "Availability",
    svisit: "Service",

    vpmin: "Min price",
    vpmax: "Max price",
    vtype: "Type",
    vcond: "Condition",
    vneg: "Negotiable",

    csub: "Subject",
    clevel: "Level",
    cmode: "Mode",
    gtype: "Type",
    ttype: "Travel type",
    tbmin: "Min budget",
    tbmax: "Max budget",
  };

  const map = lang === "es" ? es : en;
  return map[key] || key;
}

function prettyValue(key: string, value: string, lang: Lang): string {
  const v = value.trim();
  if (!v) return v;

  if (key === "tbmin" || key === "tbmax") {
    const n = v.replace(/[^0-9.]/g, "");
    return n ? `$${n}` : v;
  }

  if (key === "aseller" || key === "rseller") {
    if (v === "personal") return lang === "es" ? "Personal" : "Personal";
    if (v === "business") return lang === "es" ? "Negocio" : "Business";
  }


  if (key === "ttype") {
    const esMap: Record<string, string> = {
      package: "Paquete",
      cruise: "Crucero",
      hotel: "Hotel / Resort",
      flight: "Vuelo",
      tour: "Tour",
      other: "Otro",
    };
    const enMap: Record<string, string> = {
      package: "Package",
      cruise: "Cruise",
      hotel: "Hotel / Resort",
      flight: "Flight",
      tour: "Tour",
      other: "Other",
    };
    const map = lang === "es" ? esMap : enMap;
    return map[v] ?? v;
  }

  if (key === "svisit") {
    if (v === "comes") return lang === "es" ? "A domicilio" : "Comes to you";
    if (v === "shop") return lang === "es" ? "En local" : "At a shop";
  }

  if (key === "eremote") {
    if (v === "remote") return lang === "es" ? "Remoto" : "Remote";
    if (v === "onsite") return lang === "es" ? "Presencial" : "On-site";
  }

  if (key === "ejob") {
    const esMap: Record<string, string> = {
      full: "Tiempo completo",
      part: "Medio tiempo",
      contract: "Contrato",
      temp: "Temporal",
    };
    const enMap: Record<string, string> = {
      full: "Full-time",
      part: "Part-time",
      contract: "Contract",
      temp: "Temp",
    };
    return (lang === "es" ? esMap : enMap)[v] || v;
  }

  if (key === "acond") {
    const esMap: Record<string, string> = { new: "Nuevo", used: "Usado" };
    const enMap: Record<string, string> = { new: "New", used: "Used" };
    return (lang === "es" ? esMap : enMap)[v] || v;
  }

  if (key === "vneg" && v === "yes") return lang === "es" ? "Sí" : "Yes";

  return v;
}

export default function ActiveFilterChips({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || "";

  const t = useMemo(() => {
    const es = {
      clearAll: "Quitar filtros",
      search: "Búsqueda",
      location: "Ciudad",
      radius: "Radio",
      category: "Categoría",
      sort: "Orden",
      zip: "ZIP",
      view: "Vista",
    };
    const en = {
      clearAll: "Clear filters",
      search: "Search",
      location: "City",
      radius: "Radius",
      category: "Category",
      sort: "Sort",
      zip: "ZIP",
      view: "View",
    };
    return lang === "es" ? es : en;
  }, [lang]);

  const chips = useMemo(() => {
    const sp = params;
    if (!sp) return [] as Array<{ key: string; label: string; value: string }>;

    const out: Array<{ key: string; label: string; value: string }> = [];

    const q = sp.get("q")?.trim() ?? "";
    const city = sp.get("city")?.trim() ?? "";
        const radius = (sp.get("radius")?.trim() ?? sp.get("r")?.trim() ?? "");
    const cat = sp.get("cat")?.trim() ?? "";
    const sort = sp.get("sort")?.trim() ?? "";
    const zip = sp.get("zip")?.trim() ?? "";
    const view = sp.get("view")?.trim() ?? "";
    const langParam = (sp.get("lang") === "en" ? "en" : "es") as Lang;

    if (q) out.push({ key: "q", label: t.search, value: q });
    if (city) out.push({ key: "city", label: t.location, value: city });
    if (radius) out.push({ key: "radius", label: t.radius, value: prettyRadius(radius) || radius });
    if (cat) out.push({ key: "cat", label: t.category, value: cat });
    if (sort) out.push({ key: "sort", label: t.sort, value: sort });
    if (zip) out.push({ key: "zip", label: t.zip, value: zip });
    if (view) out.push({ key: "view", label: t.view, value: view });

    // Any other deep filters become chips too (UI only)
    sp.forEach((value, key) => {
      const v = value?.trim() ?? "";
      if (!v) return;
      if (["lang", "q", "city", "radius", "r", "cat", "sort", "zip", "view", "page"].includes(key)) return;
      out.push({ key, label: prettyKeyLabel(key, langParam), value: prettyValue(key, v, langParam) });
    });

    return out;
  }, [params, t.category, t.location, t.radius, t.search, t.sort]);

  const clearAllHref = useMemo(() => {
    const sp = new URLSearchParams(params?.toString() ?? "");
    const langParam = sp.get("lang");
        const catParam = sp.get("cat");
    const viewParam = sp.get("view");
    sp.forEach((_, key) => {
      if (["lang", "cat", "view"].includes(key)) return;
      sp.delete(key);
    });
    if (langParam) sp.set("lang", langParam);
    if (catParam) sp.set("cat", catParam);
    if (viewParam) sp.set("view", viewParam);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [params, pathname]);

  if (!chips.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}:${c.value}`}
          type="button"
          onClick={() => {
            const sp = new URLSearchParams(params?.toString() ?? "");
            sp.delete(c.key);
            const qs = sp.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
          className={cx(
            "inline-flex items-center gap-2 rounded-full border",
            "border-white/12 bg-white/6 px-3 py-1",
            "text-xs text-white hover:bg-white/10 transition"
          )}
          aria-label={`${c.label}: ${c.value}`}
        >
          <span className="text-white">{c.label}:</span>
          <span className="font-semibold text-white">{c.value}</span>
          <span className="text-white">×</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => router.push(clearAllHref)}
        className="ml-2 inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-white hover:bg-white/10 transition"
      >
        {t.clearAll}
      </button>
    </div>
  );
}
