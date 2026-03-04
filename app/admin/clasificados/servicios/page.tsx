"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "leonix_admin_servicios_listings_v1";

export type AdminServiciosListing = {
  id: string;
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
};

const STYPE_OPTIONS = [
  "plumbing",
  "electrician",
  "landscaping",
  "cleaning",
  "mechanic",
  "handyman",
  "painting",
  "hvac",
  "moving",
  "smog",
  "tow",
  "other",
];

function loadListings(): AdminServiciosListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
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

  useEffect(() => {
    setListings(loadListings());
    setMounted(true);
  }, []);

  const [title, setTitle] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !city.trim()) return;
    const newListing: AdminServiciosListing = {
      id: "admin-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      category: "servicios",
      stype: stype.trim() || "other",
      title: title.trim(),
      city: city.trim(),
      zip: zip.trim() || undefined,
      tier,
      status: "active",
      createdAt: new Date().toISOString(),
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      quoteEnabled: quoteEnabled || undefined,
      videoCallEnabled: videoCallEnabled || undefined,
      videoCallUrl: videoCallUrl.trim() || undefined,
      mobile: mobile || undefined,
      shop: shop || undefined,
      urgent247: urgent247 || undefined,
    };
    const next = [...listings, newListing];
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">stype *</label>
            <select
              value={stype}
              onChange={(e) => setStype(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            >
              {STYPE_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Tier *</label>
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
            <label className="block text-xs font-semibold text-[#111111] mb-1">ZIP (optional)</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Phone (optional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#111111] mb-1">Website (optional)</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={mobile} onChange={(e) => setMobile(e.target.checked)} />
            A domicilio (mobile)
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={shop} onChange={(e) => setShop(e.target.checked)} />
            En local (shop)
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={urgent247} onChange={(e) => setUrgent247(e.target.checked)} />
            Urgente / 24-7
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={quoteEnabled} onChange={(e) => setQuoteEnabled(e.target.checked)} />
            Quote enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-[#111111]">
            <input type="checkbox" checked={videoCallEnabled} onChange={(e) => setVideoCallEnabled(e.target.checked)} />
            Video call enabled
          </label>
        </div>
        {videoCallEnabled ? (
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">Video call URL</label>
            <input
              type="url"
              value={videoCallUrl}
              onChange={(e) => setVideoCallUrl(e.target.value)}
              className="w-full rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111]"
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
        <h2 className="text-sm font-semibold text-[#111111] p-4 border-b border-black/10">Listings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-black/10 bg-[#F5F5F5]">
                <th className="p-3 font-semibold text-[#111111]">Title</th>
                <th className="p-3 font-semibold text-[#111111]">stype</th>
                <th className="p-3 font-semibold text-[#111111]">City</th>
                <th className="p-3 font-semibold text-[#111111]">Tier</th>
                <th className="p-3 font-semibold text-[#111111]">Status</th>
                <th className="p-3 font-semibold text-[#111111]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-[#666]">No listings yet. Create one above.</td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l.id} className="border-b border-black/5">
                    <td className="p-3 text-[#111111]">{l.title}</td>
                    <td className="p-3 text-[#111111]">{l.stype}</td>
                    <td className="p-3 text-[#111111]">{l.city}</td>
                    <td className="p-3 text-[#111111]">{l.tier}</td>
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
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => deleteListing(l.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
