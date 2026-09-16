"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { businessApiFetch } from "../../../../_components/businessApiClient";
import { BusinessProfilePresentation } from "@/app/lib/business/profile/BusinessProfilePresentation";
import type { Business, BusinessContact, BusinessCustomLink, BusinessDigitalProfile, BusinessServiceArea } from "@/app/lib/business/types";

/**
 * Staff-Created Business Profile pipeline -- the owner's own preview, rendered through the exact
 * same BusinessProfilePresentation component the public page and the staff preview use.
 */

type SummaryResponse = {
  business: Business;
  contacts: BusinessContact[];
  serviceAreas: BusinessServiceArea[];
  digitalProfiles: BusinessDigitalProfile[];
  customLinks: BusinessCustomLink[];
};

type ProfileResponse = {
  profile: {
    status: "draft" | "published";
    headline: string | null;
    shortDescription: string | null;
    aboutDescription: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    galleryImages: string[];
    featuredHighlights: { title: string; description: string }[];
  } | null;
};

function OwnerBusinessProfilePreviewContent() {
  const router = useRouter();
  const params = useParams<{ businessId: string }>();
  const pathname = usePathname() ?? "/dashboard/business-tools";
  const businessId = params?.businessId ?? "";

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse["profile"]>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setCheckedAuth(true);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    if (!checkedAuth || !businessId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrored(false);
      const [summaryResult, profileResult] = await Promise.all([
        businessApiFetch<SummaryResponse>("/api/dashboard/business/summary"),
        businessApiFetch<ProfileResponse>(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`),
      ]);
      if (cancelled) return;
      if (!summaryResult.ok || summaryResult.data.business.id !== businessId || !profileResult.ok) {
        setErrored(true);
      } else {
        setSummary(summaryResult.data);
        setProfile(profileResult.data.profile);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [checkedAuth, businessId]);

  if (!checkedAuth || loading) {
    return <div role="status" aria-live="polite" className="min-h-screen p-10 text-center text-sm text-[#5C5346]">Cargando… / Loading…</div>;
  }
  if (errored || !summary) {
    return <div role="alert" className="min-h-screen p-10 text-center text-sm text-[#5C5346]">No se pudo cargar. / Could not load.</div>;
  }

  return (
    <BusinessProfilePresentation
      mode="owner_preview"
      profileStatus={profile?.status ?? "draft"}
      business={{
        displayName: summary.business.displayName,
        publicName: summary.business.publicName,
        broadBusinessType: summary.business.broadBusinessType,
        specificBusinessType: summary.business.specificBusinessType,
        customSpecificType: summary.business.customSpecificType,
      }}
      profile={{
        headline: profile?.headline ?? null,
        shortDescription: profile?.shortDescription ?? null,
        aboutDescription: profile?.aboutDescription ?? null,
        logoUrl: profile?.logoUrl ?? null,
        heroImageUrl: profile?.heroImageUrl ?? null,
        galleryImages: profile?.galleryImages ?? [],
        featuredHighlights: profile?.featuredHighlights ?? [],
      }}
      contacts={summary.contacts
        .filter((c) => c.visibility === "public")
        .map((c) => ({ contactType: c.contactType, value: c.value, label: c.label, isPrimary: c.isPrimary, channelKind: c.channelKind }))}
      digitalProfiles={summary.digitalProfiles.map((d) => ({ platform: d.platform, handleOrUrl: d.handleOrUrl }))}
      customLinks={summary.customLinks
        .filter((l) => l.visibility === "public")
        .map((l) => ({ linkType: l.linkType, customLabel: l.customLabel, displayUrl: l.displayUrl, sortOrder: l.sortOrder }))}
      serviceAreas={summary.serviceAreas.map((a) => ({ country: a.country, cityHint: a.cityHint, areaKind: a.areaKind, isPrimary: a.isPrimary }))}
    />
  );
}

export default function OwnerBusinessProfilePreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <OwnerBusinessProfilePreviewContent />
    </Suspense>
  );
}
