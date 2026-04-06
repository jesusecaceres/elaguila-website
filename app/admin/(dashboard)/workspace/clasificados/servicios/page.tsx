"use client";

import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "leonix_admin_servicios_listings_v1";

function getCurrentCycleKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getBoostCreditsForTier(tier: "premium" | "plus" | "standard"): number {
  if (tier === "premium") return 2;
  if (tier === "plus") return 1;
  return 0;
}

export type AdminServiciosListing = {
  id: string;
  listingId?: string; // optional for backwards compat
  businessId: string; // stable "SV-000123"
  category: "servicios";
  stype: string;
  title: string;
  city: string;
  zip?: string;
  tier: "premium" | "plus" | "standard";
  status: "active" | "paused" | "removed";
  createdAt: string;
  phone?: string;
  website?: string;
  quoteEnabled?: boolean;
  videoCallEnabled?: boolean;
  videoCallUrl?: string;
  mobile?: boolean;
  shop?: boolean;
  urgent247?: boolean;
  servicesOffered?: string[];
  boostCreditsPerCycle?: number;
  boostUsedThisCycle?: number;
  boostUntil?: string;
  boostCycleKey?: string;
  stypeLabelEs?: string;
};

/** Normalize website input: empty allowed; add https if missing; special cases for leonixmedia. */
function normalizeWebsite(val: string): string {
  const v = (val ?? "").trim();
  if (!v) return "";
  const lower = v.toLowerCase();
  if (lower === "leonixmedia.com" || lower === "www.leonixmedia.com") return "https://leonixmedia.com";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return "https://" + v;
}

type StypeOption = { key: string; labelEs: string; labelEn: string };
type StypeGroup = { id: string; labelEs: string; labelEn: string; options: StypeOption[] };

const STYPE_GROUPS: StypeGroup[] = [
  {
    id: "home-garden",
    labelEs: "Hogar y Jardín",
    labelEn: "Home & Garden",
    options: [
      { key: "handyman", labelEs: "Contratistas y handyman", labelEn: "Contractors & Handyman" },
      { key: "plumbing", labelEs: "Plomería", labelEn: "Plumbing" },
      { key: "electrician", labelEs: "Electricista", labelEn: "Electrician" },
      { key: "painting", labelEs: "Pintura", labelEn: "Painters" },
      { key: "remodeling", labelEs: "Remodelación", labelEn: "Remodeling" },
      { key: "landscaping", labelEs: "Jardinería", labelEn: "Landscaping" },
      { key: "cleaning", labelEs: "Limpieza del hogar", labelEn: "Home Cleaning" },
      { key: "moving", labelEs: "Mudanzas", labelEn: "Movers" },
      { key: "hvac", labelEs: "Calefacción y A/C", labelEn: "Heating & A/C" },
      { key: "roofing", labelEs: "Techos", labelEn: "Roofing" },
      { key: "flooring", labelEs: "Pisos", labelEn: "Flooring" },
      { key: "appliance", labelEs: "Reparación de electrodomésticos", labelEn: "Appliance Repair" },
      { key: "locksmith", labelEs: "Cerrajería", labelEn: "Locksmiths" },
    ],
  },
  {
    id: "autos",
    labelEs: "Servicios Automotrices",
    labelEn: "Auto Services",
    options: [
      { key: "mechanic", labelEs: "Mecánico", labelEn: "Auto Repair" },
      { key: "bodyshop", labelEs: "Taller de carrocería", labelEn: "Body Shops" },
      { key: "tires", labelEs: "Llantas", labelEn: "Tires" },
      { key: "oilchange", labelEs: "Cambio de aceite", labelEn: "Oil Change" },
      { key: "carwash", labelEs: "Lavado de autos", labelEn: "Car Wash" },
      { key: "detail", labelEs: "Detallado", labelEn: "Auto Detailing" },
      { key: "smog", labelEs: "Smog y emisiones", labelEn: "Smog Check" },
      { key: "tow", labelEs: "Grúa", labelEn: "Towing" },
      { key: "glass", labelEs: "Vidrios y parabrisas", labelEn: "Auto Glass" },
      { key: "battery", labelEs: "Baterías", labelEn: "Batteries" },
      { key: "alignment", labelEs: "Alineación y balanceo", labelEn: "Alignment & Balancing" },
    ],
  },
  {
    id: "health-beauty",
    labelEs: "Salud y Bienestar",
    labelEn: "Health & Wellness",
    options: [
      { key: "chiropractor", labelEs: "Quiroprácticos", labelEn: "Chiropractors" },
      { key: "physicaltherapy", labelEs: "Fisioterapia", labelEn: "Physical Therapy" },
      { key: "dentist", labelEs: "Dentistas", labelEn: "Dentists" },
      { key: "doctor", labelEs: "Doctores y clínicas", labelEn: "Doctors & Clinics" },
      { key: "therapy", labelEs: "Terapia", labelEn: "Therapy" },
      { key: "optometry", labelEs: "Optometría", labelEn: "Optometry" },
      { key: "dermatology", labelEs: "Dermatología", labelEn: "Dermatology" },
      { key: "barber", labelEs: "Barberías", labelEn: "Barbers" },
      { key: "hair", labelEs: "Salones de cabello", labelEn: "Hair Salons" },
      { key: "nails", labelEs: "Uñas", labelEn: "Nail Salons" },
      { key: "massage", labelEs: "Masajes", labelEn: "Massage" },
      { key: "spa", labelEs: "Spa", labelEn: "Spa" },
    ],
  },
  {
    id: "more",
    labelEs: "Más servicios",
    labelEn: "More Services",
    options: [
      { key: "photography", labelEs: "Fotografía y video", labelEn: "Photography & Video" },
      { key: "tutoring", labelEs: "Clases particulares", labelEn: "Tutoring" },
      { key: "legal", labelEs: "Servicios legales", labelEn: "Legal" },
      { key: "accounting", labelEs: "Contabilidad e impuestos", labelEn: "Accounting & Taxes" },
      { key: "insurance", labelEs: "Seguros", labelEn: "Insurance" },
      { key: "notary", labelEs: "Notaría", labelEn: "Notary" },
      { key: "translation", labelEs: "Traducciones", labelEn: "Translation" },
      { key: "childcare", labelEs: "Cuidado de niños", labelEn: "Childcare" },
      { key: "seniorcare", labelEs: "Cuidado de adultos mayores", labelEn: "Senior Care" },
      { key: "pet", labelEs: "Mascotas", labelEn: "Pet Services" },
      { key: "drycleaning", labelEs: "Limpieza en seco", labelEn: "Dry Cleaning" },
      { key: "laundry", labelEs: "Lavanderías", labelEn: "Laundromats" },
      { key: "tailoring", labelEs: "Sastrería y alteraciones", labelEn: "Tailoring & Alterations" },
      { key: "realestate", labelEs: "Bienes raíces (agentes)", labelEn: "Real Estate" },
      { key: "banking", labelEs: "Bancos y uniones de crédito", labelEn: "Banking & Credit Unions" },
      { key: "gym", labelEs: "Gimnasios y yoga", labelEn: "Gyms & Yoga" },
      { key: "computer", labelEs: "Reparación de computadoras", labelEn: "Computer Repair" },
      { key: "cell", labelEs: "Celulares y móviles", labelEn: "Cell/Mobile" },
      { key: "financial", labelEs: "Servicios financieros", labelEn: "Financial" },
      { key: "other", labelEs: "Otros servicios", labelEn: "Other" },
    ],
  },
];

function findStypeGroup(stypeKey: string): StypeGroup {
  for (const g of STYPE_GROUPS) {
    if (g.options.some((o) => o.key === stypeKey)) return g;
  }
  return STYPE_GROUPS[0];
}

function nextBusinessIdNumber(listings: AdminServiciosListing[]): number {
  let max = 0;
  for (const l of listings) {
    const bid = l.businessId ?? "";
    const m = bid.match(/^SV-(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

function backfillAndCycle(listings: AdminServiciosListing[]): AdminServiciosListing[] {
  const currentKey = getCurrentCycleKey();
  let nextNum = nextBusinessIdNumber(listings);
  return listings.map((l) => {
    let businessId = l.businessId;
    if (!businessId || !/^SV-\d{6}$/i.test(businessId)) {
      businessId = "SV-" + String(nextNum++).padStart(6, "0");
    }
    const listingId = l.listingId ?? l.id;
    const boostCycleKey = l.boostCycleKey ?? currentKey;
    const cycleChanged = boostCycleKey !== currentKey;
    const boostUsedThisCycle = cycleChanged ? 0 : (l.boostUsedThisCycle ?? 0);
    const credits = l.boostCreditsPerCycle ?? getBoostCreditsForTier(l.tier);
    return {
      ...l,
      businessId,
      listingId,
      boostCreditsPerCycle: credits,
      boostUsedThisCycle,
      boostCycleKey: currentKey,
      boostUntil: l.boostUntil,
    };
  });
}

function loadListings(): AdminServiciosListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const parsed = arr as AdminServiciosListing[];
    return backfillAndCycle(parsed);
  } catch {
    return [];
  }
}

function saveListings(listings: AdminServiciosListing[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}

export default function AdminServiciosPage() {
  const [listings, setListings] = useState<AdminServiciosListing[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const migrated = loadListings();
    setListings(migrated);
    saveListings(migrated); // persist backfill + cycle reset
    setMounted(true);
  }, []);

  const currentCycleKey = getCurrentCycleKey();

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => {
      const bid = (l.businessId ?? "").toLowerCase();
      const tit = (l.title ?? "").toLowerCase();
      const ph = (l.phone ?? "").toLowerCase();
      const city = (l.city ?? "").toLowerCase();
      const st = (l.stype ?? "").toLowerCase();
      return bid.includes(q) || tit.includes(q) || ph.includes(q) || city.includes(q) || st.includes(q);
    });
  }, [listings, searchQuery]);

  const [title, setTitle] = useState("");
  const [stypeGroupId, setStypeGroupId] = useState("home-garden");
  const [stype, setStype] = useState("plumbing");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState<"premium" | "plus" | "standard">("standard");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [mobile, setMobile] = useState(false);
  const [shop, setShop] = useState(false);
  const [urgent247, setUrgent247] = useState(false);
  const [quoteEnabled, setQuoteEnabled] = useState(false);
  const [videoCallEnabled, setVideoCallEnabled] = useState(false);
  const [videoCallUrl, setVideoCallUrl] = useState("");

  const currentGroup = STYPE_GROUPS.find((g) => g.id === stypeGroupId) ?? STYPE_GROUPS[0];
  const currentStypeOption = currentGroup.options.find((o) => o.key === stype) ?? currentGroup.options[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !city.trim()) return;
    const id = "admin-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const nextNum = nextBusinessIdNumber(listings);
    const businessId = "SV-" + String(nextNum).padStart(6, "0");
    const credits = getBoostCreditsForTier(tier);
    const newListing: AdminServiciosListing = {
      id,
      listingId: id,
      businessId,
      category: "servicios",
      stype: stype.trim() || "other",
      stypeLabelEs: currentStypeOption?.labelEs,
      title: title.trim(),
      city: city.trim(),
      zip: zip.trim() || undefined,
      tier,
      status: "active",
      createdAt: new Date().toISOString(),
      phone: phone.trim() || undefined,
      website: normalizeWebsite(website),
      quoteEnabled: quoteEnabled || undefined,
      videoCallEnabled: videoCallEnabled || undefined,
      videoCallUrl: videoCallUrl.trim() || undefined,
      mobile: mobile || undefined,
      shop: shop || undefined,
      urgent247: urgent247 || undefined,
      boostCreditsPerCycle: credits,
      boostUsedThisCycle: 0,
      boostCycleKey: currentCycleKey,
    };
    const next = backfillAndCycle([...listings, newListing]);
    setListings(next);
    saveListings(next);
    setTitle("");
    setCity("");
    setZip("");
    setPhone("");
    setWebsite("");
    setMobile(false);
    setShop(false);
    setUrgent247(false);
    setQuoteEnabled(false);
    setVideoCallEnabled(false);
    setVideoCallUrl("");
  };

  const setStatus = (id: string, status: "active" | "paused" | "removed") => {
    const next = listings.map((l) => (l.id === id ? { ...l, status } : l));
    setListings(next);
    saveListings(next);
  };

  const deleteListing = (id: string) => {
    const next = listings.filter((l) => l.id !== id);
    setListings(next);
    saveListings(next);
  };

  const activateBoost = (id: string) => {
    const l = listings.find((x) => x.id === id);
    if (!l) return;
    const credits = l.boostCreditsPerCycle ?? getBoostCreditsForTier(l.tier);
    const used = l.boostUsedThisCycle ?? 0;
    const now = Date.now();
    const until = l.boostUntil ? new Date(l.boostUntil).getTime() : 0;
    const hasActiveBoost = until > now;
    if (hasActiveBoost || used >= credits) return;
    const boostUntil = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();
    const next = listings.map((x) =>
      x.id === id ? { ...x, boostUntil, boostUsedThisCycle: (x.boostUsedThisCycle ?? 0) + 1 } : x
    );
    setListings(next);
    saveListings(next);
  };

  const resetCycle = (id: string) => {
    const next = listings.map((l) =>
      l.id === id ? { ...l, boostCycleKey: currentCycleKey, boostUsedThisCycle: 0 } : l
    );
    setListings(next);
    saveListings(next);
  };

  if (!mounted) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <p className="text-sm text-[#666]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-[#111111]">Servicios – Create listing</h1>

      <form onSubmit={handleSubmit} className="rounded-xl border border-black/10 bg-white p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs font-semibold text-[#111111] mb-1">Nombre del negocio / Business name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Grupo / Group *</label>
            <select
              value={stypeGroupId}
              onChange={(e) => {
                const gid = e.target.value;
                setStypeGroupId(gid);
                const g = STYPE_GROUPS.find((x) => x.id === gid);
                if (g) setStype(g.options[0].key);
              }}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            >
              {STYPE_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>{g.labelEs} / {g.labelEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Subcategoría / Subcategory *</label>
            <select
              value={stype}
              onChange={(e) => setStype(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            >
              {currentGroup.options.map((o) => (
                <option key={o.key} value={o.key}>{o.labelEs} / {o.labelEn}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Ciudad / City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Nivel / Tier *</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "premium" | "plus" | "standard")}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            >
              <option value="standard">standard</option>
              <option value="plus">plus</option>
              <option value="premium">premium</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">ZIP (opcional)</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Teléfono / Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111111] mb-1">Sitio web / Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="leonixmedia.com o https://..."
            className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#666]"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={mobile} onChange={(e) => setMobile(e.target.checked)} />
            A domicilio (móvil) / Mobile
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={shop} onChange={(e) => setShop(e.target.checked)} />
            En local (tienda) / Shop
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={urgent247} onChange={(e) => setUrgent247(e.target.checked)} />
            Urgente 24/7 / Urgent 24/7
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={quoteEnabled} onChange={(e) => setQuoteEnabled(e.target.checked)} />
            Cotización / Quote enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={videoCallEnabled} onChange={(e) => setVideoCallEnabled(e.target.checked)} />
            Video llamada / Video call
          </label>
        </div>
        {videoCallEnabled ? (
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Video call URL</label>
            <input
              type="text"
              value={videoCallUrl}
              onChange={(e) => setVideoCallUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#666]"
            />
          </div>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/50"
        >
          Save listing
        </button>
      </form>

      <div className="rounded-xl border border-black/10 bg-white overflow-hidden">
        <div className="p-4 border-b border-black/10 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#111111]">Listings</h2>
          <input
            type="text"
            placeholder="Search by ID, title, phone, city, stype…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-sm rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#666]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-black/10 bg-[#F5F5F5]">
                <th className="p-3 font-semibold text-[#111111]">ID</th>
                <th className="p-3 font-semibold text-[#111111]">Title</th>
                <th className="p-3 font-semibold text-[#111111]">stype</th>
                <th className="p-3 font-semibold text-[#111111]">City</th>
                <th className="p-3 font-semibold text-[#111111]">Tier</th>
                <th className="p-3 font-semibold text-[#111111]">Boosts</th>
                <th className="p-3 font-semibold text-[#111111]">Status</th>
                <th className="p-3 font-semibold text-[#111111]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-[#666]">
                    {listings.length === 0 ? "No listings yet. Create one above." : "No matches for search."}
                  </td>
                </tr>
              ) : (
                filteredListings.map((l) => {
                  const credits = l.boostCreditsPerCycle ?? getBoostCreditsForTier(l.tier);
                  const used = l.boostUsedThisCycle ?? 0;
                  const now = Date.now();
                  const until = l.boostUntil ? new Date(l.boostUntil).getTime() : 0;
                  const hasActiveBoost = until > now;
                  const canBoost = !hasActiveBoost && used < credits;
                  const untilStr = l.boostUntil ? new Date(l.boostUntil).toLocaleDateString() : "";
                  return (
                    <tr key={l.id} className="border-b border-black/5">
                      <td className="p-3 text-[#111111] font-mono text-xs">{l.businessId}</td>
                      <td className="p-3 text-[#111111]">{l.title}</td>
                      <td className="p-3 text-[#111111]">{l.stype}</td>
                      <td className="p-3 text-[#111111]">{l.city}</td>
                      <td className="p-3 text-[#111111]">{l.tier}</td>
                      <td className="p-3">
                        <span className="text-[#111111]">Boosts: {used}/{credits}</span>
                        {hasActiveBoost && (
                          <div className="text-xs text-[#1F7A3A] mt-0.5">
                            Boost activo hasta {untilStr}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={l.status}
                          onChange={(e) => setStatus(l.id, e.target.value as "active" | "paused" | "removed")}
                          className="rounded border border-black/10 bg-white px-2 py-1 text-[#111111]"
                        >
                          <option value="active">active</option>
                          <option value="paused">paused</option>
                          <option value="removed">removed</option>
                        </select>
                      </td>
                      <td className="p-3 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => activateBoost(l.id)}
                          disabled={!canBoost}
                          title={!canBoost ? (hasActiveBoost ? `Boost activo hasta ${untilStr}` : "Sin boosts disponibles") : "Boost 5 días"}
                          className="rounded border border-black/10 bg-[#F5F5F5] px-2 py-1 text-xs text-[#111111] hover:bg-[#EFEFEF] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Boost 5 días
                        </button>
                        <button
                          type="button"
                          onClick={() => resetCycle(l.id)}
                          title="Reset ciclo (testing)"
                          className="rounded border border-black/10 bg-[#F5F5F5] px-2 py-1 text-xs text-[#666] hover:bg-[#EFEFEF]"
                        >
                          Reset ciclo
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteListing(l.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
