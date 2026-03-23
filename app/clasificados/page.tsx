"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

import { SAMPLE_LISTINGS } from "../data/classifieds/sampleListings";
import RecentlyViewedSection from "./components/RecentlyViewedSection";
import { HubCategoryTile } from "./components/HubCategoryTile";
import { HubListingCardCompact } from "./components/HubListingCardCompact";
import { HubPlanCard } from "./components/HubPlanCard";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { HUB_CATEGORY_ORDER, type HubListing, type Lang } from "./config/clasificadosHub";
import { getClasificadosHubCopy } from "./config/clasificadosHubCopy";
import { appendLangToPath, buildHubCategoryListUrl, buildHubListUrl, buildHubPostEntryHref } from "./lib/hubUrl";
import { buildHubFeaturedLimits } from "./lib/hubFeaturedLimits";
import { buildFeaturedByCategory } from "./lib/hubFeaturedSelection";
import { dedupeHubListingsById, mapDbRowToHubListing } from "./lib/mapDbRowToHubListing";

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = (params?.get("lang") === "en" ? "en" : "es") as Lang;

  const t = useMemo(() => getClasificadosHubCopy(lang), [lang]);

  const postEntryHref = buildHubPostEntryHref(lang);

  const withLang = (path: string) => appendLangToPath(path, lang);

  const sampleListings: HubListing[] = useMemo(
    () => SAMPLE_LISTINGS as unknown as HubListing[],
    []
  );

  const [supabaseListings, setSupabaseListings] = useState<HubListing[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("listings")
          .select(
            "id, title, description, city, category, price, is_free, images, created_at, seller_type, status"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(500);
        if (cancelled) return;
        if (error) return;
        const rows = (data ?? []) as Record<string, unknown>[];
        const mapped: HubListing[] = [];
        for (const r of rows) {
          const m = mapDbRowToHubListing(r);
          if (m) mapped.push(m);
        }
        setSupabaseListings(mapped);
      } catch {
        /* fail soft: demo-only hub */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const poolListings = useMemo(
    () => dedupeHubListingsById([...sampleListings, ...supabaseListings]),
    [sampleListings, supabaseListings]
  );

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    return () => mq.removeEventListener?.("change", set);
  }, []);

  const limits = useMemo(() => buildHubFeaturedLimits(isMobile), [isMobile]);

  const featuredByCategory = useMemo(
    () => buildFeaturedByCategory(poolListings, limits),
    [limits, poolListings]
  );

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-28 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28">
        <div className="relative text-center mb-14">
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mb-6 sm:mb-0 sm:absolute sm:right-0 sm:top-0">
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={withLang(t.routeLogin)}
              className="px-4 py-2 text-sm rounded-full border border-[#C9B46A]/70 bg-[#111111]/10 text-[#111111] font-semibold hover:bg-[#111111]/12 transition"
            >
              {t.authCreate}
            </a>
          </div>

          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />

          <h1 className="text-6xl md:text-7xl font-bold text-[#111111]">
            {t.pageTitle}
          </h1>
          <p className="mt-5 text-[#111111] max-w-3xl mx-auto text-lg md:text-xl">
            {t.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={postEntryHref}
              className="px-5 py-2.5 text-sm rounded-full bg-[#111111] text-[#F5F5F5] font-semibold hover:opacity-95 transition"
            >
              {t.ctaPost}
            </a>

            <Link
              href={buildHubListUrl(lang)}
              className="px-5 py-2.5 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
              aria-label={t.ctaView}
            >
              {t.ctaView}
            </Link>

            <Link
              href={withLang(t.routeMemberships)}
              className="px-5 py-2.5 text-sm rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] text-[#111111] font-semibold hover:bg-[#F5F5F5] transition"
              aria-label={t.ctaMemberships}
            >
              {t.ctaMemberships}
            </Link>
          </div>

          <div className="mt-8 text-sm text-[#111111] max-w-3xl mx-auto">
            {t.trustLine}
          </div>
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">
            {t.sectionBrowse}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HUB_CATEGORY_ORDER.map((k) => {
            const meta = (t.cat as Record<string, { label: string; hint: string }>)[k];
            return (
              <HubCategoryTile
                key={k}
                href={buildHubCategoryListUrl(k, lang)}
                label={meta.label}
                hint={meta.hint}
              />
            );
          })}
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6 mt-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">{t.sectionFeatured}</h2>
          <p className="text-sm text-[#111111]/80 max-w-3xl">{t.sectionFeaturedHint}</p>
        </div>

        <div className="mt-8 space-y-10">
          {HUB_CATEGORY_ORDER.map((cat) => {
            const items = featuredByCategory[cat];
            if (!items.length) return null;
            const meta = (t.cat as Record<string, { label: string; hint: string }>)[cat];
            return (
              <div key={cat}>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-[#111111]">{meta.label}</h3>
                  <Link
                    href={buildHubListUrl(lang, cat)}
                    className="text-sm font-semibold text-[#111111] underline underline-offset-2 hover:opacity-90"
                  >
                    {t.viewMore}
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <HubListingCardCompact key={item.id} item={item} lang={lang} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-6 mt-12">
        <RecentlyViewedSection lang={lang} />
      </section>

      <section id="memberships" className="max-w-screen-2xl mx-auto px-6 mt-16">
        <div className="border border-[#C9B46A]/70 rounded-2xl p-8 bg-[#EFEFEF]">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">
              {t.membershipsTitle}
            </h2>
            <p className="mt-2 text-sm text-[#111111] max-w-3xl">
              {t.membershipsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/70 mb-3">
                {t.personalHeading}
              </p>
              <div className="space-y-4">
                <HubPlanCard title={t.freeTitle} bullets={t.freeBullets} />
                <HubPlanCard title={t.proTitle} bullets={t.proBullets} accent="gold" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/70 mb-3">
                {t.negociosHeading}
              </p>
              <div className="space-y-4">
                <HubPlanCard
                  title={t.standardTitle}
                  price={t.standardPrice}
                  bullets={t.standardBullets}
                  accent="strong"
                />
                <HubPlanCard
                  title={t.plusTitle}
                  price={t.plusPrice}
                  bullets={t.plusBullets}
                  accent="strong"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#C9B46A]/30 bg-[#F5F5F5] p-5">
            <h3 className="text-base font-semibold text-[#111111]">{t.printTitle}</h3>
            <p className="mt-2 text-sm text-[#111111]">{t.printBody}</p>
            <a
              href={withLang(t.routeContacto)}
              className="mt-3 inline-flex items-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition"
            >
              {t.printCta}
            </a>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href={withLang(t.routeMemberships)}
              className="inline-flex items-center rounded-full bg-[#111111] text-[#F5F5F5] font-semibold px-5 py-2.5 text-sm hover:opacity-95 transition"
            >
              {t.ctaSeeOptions}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
