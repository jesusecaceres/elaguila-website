"use client";

import Link from "next/link";
import {useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "../../../../../components/Navbar";
import { createSupabaseBrowserClient } from "../../../../../lib/supabase/browser";
import { buildProposedFinalMediaSet } from "@/app/lib/media/listingMediaContract";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  OWNER_LISTING_SOFT_ARCHIVE_PATCH,
  applyOwnerListingPatch,
} from "../../../lib/ownerListingsLifecycleClient";
import { dashboardSafeMutationErrorCopy } from "../../../lib/dashboardSafeErrorCopy";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

const EDIT_WINDOW_MINUTES = 30;
/** Gate I.5.4A.1 — same label the publish pipeline writes to `detail_pairs` for BR/Rentas Privado. */
const SELLER_PHOTO_DETAIL_LABEL = "Foto del vendedor";
const MAX_SELLER_PHOTO_BYTES = 12 * 1024 * 1024;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

/** Safe helper: extract URL strings from listings.images (jsonb). Array of strings or array of objects with url/src/path. */
function getListingImageUrls(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((u): u is string => u != null);
  }
  return [];
}

function minutesSince(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  return (Date.now() - ms) / 1000 / 60;
}

function EditListingPageContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? `/dashboard/mis-anuncios/${id}/editar`;

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        title: "Edit listing",
        back: "Back to My listings",
        loading: "Loading…",
        notFound: "We couldn’t find this listing.",
        notAllowed: "You don’t have permission to edit this listing.",
        lockedTitle: "Editing locked",
        lockedBody: `You can only edit within the first ${EDIT_WINDOW_MINUTES} minutes after posting.`,
        fieldsTitle: "Title",
        fieldsPrice: "Price",
        fieldsDesc: "Description",
        photos: "Photos",
        addPhotos: "Add photos",
        upload: "Upload",
        uploading: "Uploading…",
        photosHelp: "You can upload multiple photos. They will be saved on your listing.",
        photosUnavailable: "This listing can’t store photos yet (missing DB column).",
        save: "Save changes",
        saving: "Saving…",
        saved: "Saved",
        view: "View listing",
        markSold: "Mark sold",
        markActive: "Mark active",
        archive: "Archive ad",
        archiving: "Archiving…",
        confirmArchive: "Archive this listing? It will stop showing publicly; you can still see it in My listings.",
        errorTitle: "Something went wrong",
      },
      en: {
        title: "Edit listing",
        back: "Back to My listings",
        loading: "Loading…",
        notFound: "We couldn’t find this listing.",
        notAllowed: "You don’t have permission to edit this listing.",
        lockedTitle: "Editing locked",
        lockedBody: `You can only edit within the first ${EDIT_WINDOW_MINUTES} minutes after posting.`,
        fieldsTitle: "Title",
        fieldsPrice: "Price",
        fieldsDesc: "Description",
        photos: "Photos",
        addPhotos: "Add photos",
        upload: "Upload",
        uploading: "Uploading…",
        photosHelp: "You can upload multiple photos. They will be saved on your listing.",
        photosUnavailable: "This listing can’t store photos yet (missing DB column).",
        save: "Save changes",
        saving: "Saving…",
        saved: "Saved",
        view: "View listing",
        markSold: "Mark sold",
        markActive: "Mark active",
        archive: "Archive ad",
        archiving: "Archiving…",
        confirmArchive: "Archive this listing? It will stop showing publicly; you can still see it under My ads.",
        errorTitle: "Something went wrong",
      },
    }),
    []
  );

  const L = t[lang];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<null | "archive" | "status" >(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [listing, setListing] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");


const [userId, setUserId] = useState<string | null>(null);

const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [uploading, setUploading] = useState(false);
const [uploadNote, setUploadNote] = useState<string | null>(null);
/** Globalization Package B (Gate B2) — media action busy flag for remove/reorder/hero. */
const [mediaActionBusy, setMediaActionBusy] = useState(false);

const [sellerPhotoUrl, setSellerPhotoUrl] = useState<string>("");
const [sellerPhotoUploading, setSellerPhotoUploading] = useState(false);
const [sellerPhotoError, setSellerPhotoError] = useState<string | null>(null);


  useEffect(() => {
    const resolvedId = typeof id === "string" ? id.trim() : "";
    if (!resolvedId || !isValidUuid(resolvedId)) {
      router.replace("/dashboard/mis-anuncios");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const redirect = encodeURIComponent(`${pathname}${window.location.search || ""}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const u = data.user;
      setUserId(u.id);

      const { data: row, error: qErr } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("owner_id", u.id)
        .maybeSingle();

      if (!mounted) return;

      if (qErr) {
        console.error("[mis-anuncios/editar]", qErr.message);
        setError(dashboardSafeMutationErrorCopy(lang));
        setListing(null);
        setLoading(false);
        return;
      }

      if (!row) {
        setError(L.notFound);
        setListing(null);
        setLoading(false);
        return;
      }

      setListing(row);
      setTitle(String(row.title ?? ""));
      setPrice(row.price === null || row.price === undefined ? "" : String(row.price));
      setDescription(String((row as any).description ?? ""));
      setSellerPhotoUrl(readLeonixDetailPairValue((row as any).detail_pairs, SELLER_PHOTO_DETAIL_LABEL) ?? "");

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, router, pathname, L.notFound]);

  const createdIso: string | null = listing?.created_at || listing?.created || null;
  const mins = minutesSince(createdIso);
  const isEditable = mins !== null && mins <= EDIT_WINDOW_MINUTES;
  /** Gate I.5.4A.1 — seller photo is a Bienes Raíces Privado ("personal" seller) concept only; never shown for Negocio or other categories. */
  const isBrPrivadoListing =
    String(listing?.category ?? "").toLowerCase() === "bienes-raices" &&
    String(listing?.seller_type ?? "").toLowerCase() === "personal";


async function uploadImages() {
  if (!id || !isValidUuid(id)) {
    router.replace("/dashboard/mis-anuncios");
    return;
  }
  if (!userId) return;
  if (selectedFiles.length === 0) return;

  const supabase = createSupabaseBrowserClient();
  setUploading(true);
  setUploadNote(null);
  setError(null);
  setSuccess(null);

  const bucketCandidates = ["listing-images", "listing_images", "listings", "images"];

  const uploadedUrls: string[] = [];

  for (const file of selectedFiles) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ext.length <= 6 ? ext : "jpg";
    const path = `${userId}/${id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

    let lastErr: any = null;
    let publicUrl: string | null = null;

    for (const bucket of bucketCandidates) {
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });

      if (upErr) {
        lastErr = upErr;
        // Try next bucket if not found / invalid
        const msg = (upErr as any)?.message || "";
        if (
          msg.toLowerCase().includes("bucket") ||
          msg.toLowerCase().includes("not found")
        ) {
          continue;
        }
        // If it fails for another reason (policy, size), stop.
        break;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      publicUrl = urlData?.publicUrl ?? null;
      break;
    }

    if (!publicUrl) {
      setError(lastErr?.message || "Upload failed");
      setUploading(false);
      return;
    }

    uploadedUrls.push(publicUrl);
  }

  // Persist to DB (listings.images jsonb only; no image_urls/image). Globalization Package B
  // (Gate B2): the final set = existing + new (shared proposed-final-set semantics); a failed
  // upload returned above and can never touch proven existing media.
  try {
    const prev = getListingImageUrls(listing?.images);
    const finalSet = buildProposedFinalMediaSet({ existing: prev, uploaded: uploadedUrls });
    const ok = await persistImages(finalSet.images.map((i) => i.url));
    if (!ok) {
      setUploading(false);
      return;
    }
    setSelectedFiles([]);
    setUploadNote(null);
    setSuccess(lang === "es" ? "Fotos actualizadas" : "Photos updated");
  } catch (e: any) {
    setError(e?.message || "Upload failed");
  } finally {
    setUploading(false);
  }
}

/** Package B (Gate B2) — single persistence point for the FINAL ordered image set. */
async function persistImages(finalImages: string[]): Promise<boolean> {
  if (!id || !isValidUuid(id) || !userId) return false;
  const supabase = createSupabaseBrowserClient();
  const payload: { images: string[] } = { images: finalImages };
  const { error: uErr } = await applyOwnerListingPatch(supabase, id, userId, payload);
  if (uErr) {
    console.error("[mis-anuncios/editar]", uErr.message);
    setError(dashboardSafeMutationErrorCopy(lang));
    return false;
  }
  setListing((prev: any) => ({ ...(prev || {}), ...payload }));
  return true;
}

/**
 * Package B (Gate B2) — minimum-image floor per category, mirroring each lane's REAL publish
 * rule (never invented): rentas/bienes-raices require 1 photo
 * (leonixPublishRealEstateFromDraftState.ts publish gates), mascotas requires its single image
 * (publishMascotasPerdidosQuickToListings.ts:85-86); the other listings-family lanes publish
 * with zero photos. Removing below the floor is blocked with a truthful message.
 */
function minImagesForListingCategory(): number {
  const cat = String(listing?.category ?? "").toLowerCase();
  if (cat === "rentas" || cat === "bienes-raices" || cat === "mascotas-y-perdidos") return 1;
  return 0;
}

async function removeImageAt(index: number) {
  if (mediaActionBusy) return;
  const current = getListingImageUrls(listing?.images);
  if (index < 0 || index >= current.length) return;
  if (current.length - 1 < minImagesForListingCategory()) {
    setError(
      lang === "es"
        ? "Este anuncio necesita al menos una foto — sube una nueva antes de quitar esta."
        : "This listing needs at least one photo — upload a new one before removing this one.",
    );
    return;
  }
  setError(null);
  setMediaActionBusy(true);
  try {
    const finalSet = buildProposedFinalMediaSet({ existing: current, removedUrls: [current[index]] });
    const ok = await persistImages(finalSet.images.map((i) => i.url));
    if (ok) setSuccess(lang === "es" ? "Foto eliminada del anuncio" : "Photo removed from listing");
  } finally {
    setMediaActionBusy(false);
  }
}

async function moveImage(index: number, direction: -1 | 1) {
  if (mediaActionBusy) return;
  const current = getListingImageUrls(listing?.images);
  const target = index + direction;
  if (index < 0 || index >= current.length || target < 0 || target >= current.length) return;
  const reordered = [...current];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  setError(null);
  setMediaActionBusy(true);
  try {
    const finalSet = buildProposedFinalMediaSet({ existing: current, orderedUrls: reordered });
    const ok = await persistImages(finalSet.images.map((i) => i.url));
    if (ok) setSuccess(lang === "es" ? "Orden de fotos actualizado" : "Photo order updated");
  } finally {
    setMediaActionBusy(false);
  }
}

/** Hero = first image — the listings-family cover convention every public shell renders. */
async function makeHeroImage(index: number) {
  if (mediaActionBusy || index === 0) return;
  const current = getListingImageUrls(listing?.images);
  if (index < 0 || index >= current.length) return;
  setError(null);
  setMediaActionBusy(true);
  try {
    const finalSet = buildProposedFinalMediaSet({
      existing: current,
      orderedUrls: [current[index], ...current.filter((_, i) => i !== index)],
      heroUrl: current[index],
    });
    const ok = await persistImages(finalSet.images.map((i) => i.url));
    if (ok) setSuccess(lang === "es" ? "Foto de portada actualizada" : "Cover photo updated");
  } finally {
    setMediaActionBusy(false);
  }
}

/**
 * Gate I.5.4A.1 — replaces the BR Privado seller photo, reusing the same `listing-images` bucket
 * and owner/listing-scoped path convention as `uploadImages` above, but patching `detail_pairs`
 * (the "Foto del vendedor" pair) instead of the gallery `images` column.
 */
async function uploadSellerPhoto(file: File) {
  if (!id || !isValidUuid(id) || !userId) return;
  setSellerPhotoError(null);

  if (!file.type.startsWith("image/")) {
    setSellerPhotoError(lang === "es" ? "Elige un archivo de imagen válido." : "Choose a valid image file.");
    return;
  }
  if (file.size > MAX_SELLER_PHOTO_BYTES) {
    setSellerPhotoError(
      lang === "es"
        ? `La foto supera ${Math.round(MAX_SELLER_PHOTO_BYTES / (1024 * 1024))} MB. Elige una imagen más ligera.`
        : `The photo is over ${Math.round(MAX_SELLER_PHOTO_BYTES / (1024 * 1024))} MB. Choose a lighter image.`,
    );
    return;
  }

  const supabase = createSupabaseBrowserClient();
  setSellerPhotoUploading(true);
  setError(null);
  setSuccess(null);

  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/${id}/seller-photo.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("listing-images")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (upErr) {
    setSellerPhotoError(upErr.message || (lang === "es" ? "No se pudo subir la foto." : "Upload failed."));
    setSellerPhotoUploading(false);
    return;
  }

  const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
  const publicUrl = urlData?.publicUrl ?? null;
  if (!publicUrl) {
    setSellerPhotoError(lang === "es" ? "No se pudo obtener la URL de la foto." : "Could not resolve the photo URL.");
    setSellerPhotoUploading(false);
    return;
  }
  // Cache-bust: the fixed path can be re-uploaded on a later edit, and the CDN/browser may still hold the old bytes.
  const hostedUrl = `${publicUrl}?v=${Date.now()}`;

  const existingPairs = Array.isArray(listing?.detail_pairs) ? (listing.detail_pairs as Array<{ label?: string; value?: string }>) : [];
  const nextPairs = [...existingPairs.filter((p) => p?.label !== SELLER_PHOTO_DETAIL_LABEL), { label: SELLER_PHOTO_DETAIL_LABEL, value: hostedUrl }];

  const { error: uErr } = await applyOwnerListingPatch(supabase, id, userId, { detail_pairs: nextPairs });
  if (uErr) {
    console.error("[mis-anuncios/editar]", uErr.message);
    setSellerPhotoError(lang === "es" ? "La foto se subió pero no se pudo guardar." : "Photo uploaded but could not be saved.");
    setSellerPhotoUploading(false);
    return;
  }

  setListing((prev: any) => ({ ...(prev || {}), detail_pairs: nextPairs }));
  setSellerPhotoUrl(hostedUrl);
  setSellerPhotoUploading(false);
  setSuccess(lang === "es" ? "Foto del vendedor actualizada" : "Seller photo updated");
}

async function removeSellerPhoto() {
  if (!id || !isValidUuid(id)) return;
  setSellerPhotoError(null);
  setSellerPhotoUploading(true);

  const supabase = createSupabaseBrowserClient();
  const existingPairs = Array.isArray(listing?.detail_pairs) ? (listing.detail_pairs as Array<{ label?: string; value?: string }>) : [];
  const nextPairs = existingPairs.filter((p) => p?.label !== SELLER_PHOTO_DETAIL_LABEL);

  const { error: uErr } = await applyOwnerListingPatch(supabase, id, userId, { detail_pairs: nextPairs });
  if (uErr) {
    console.error("[mis-anuncios/editar]", uErr.message);
    setSellerPhotoError(lang === "es" ? "No se pudo quitar la foto." : "Could not remove the photo.");
    setSellerPhotoUploading(false);
    return;
  }

  setListing((prev: any) => ({ ...(prev || {}), detail_pairs: nextPairs }));
  setSellerPhotoUrl("");
  setSellerPhotoUploading(false);
  setSuccess(lang === "es" ? "Foto del vendedor eliminada" : "Seller photo removed");
}

  async function save() {
    if (!id || !isValidUuid(id)) {
      router.replace("/dashboard/mis-anuncios");
      return;
    }
    const supabase = createSupabaseBrowserClient();

    setSaving(true);
    setSuccess(null);
    setError(null);

    // Only update fields that are safe/expected.
    const payload: Record<string, any> = {
      title: title.trim() || null,
      price: price.trim() === "" ? null : price.trim(),
    };

    // Only include description if it exists in the row object (avoids guessing schema).
    if (listing && "description" in listing) {
      payload.description = description.trim() || null;
    }

    const { error: uErr } = await applyOwnerListingPatch(supabase, id, userId, payload);

    if (uErr) {
      console.error("[mis-anuncios/editar]", uErr.message);
      setError(dashboardSafeMutationErrorCopy(lang));
      setSaving(false);
      return;
    }

    setSuccess(L.saved);
    setSaving(false);
  }

  async function markStatus(status: "active" | "sold") {
    if (!id || !isValidUuid(id)) {
      router.replace("/dashboard/mis-anuncios");
      return;
    }
    const supabase = createSupabaseBrowserClient();

    setBusyAction("status");
    setError(null);
    setSuccess(null);

    const { error: uErr } = await applyOwnerListingPatch(supabase, id, userId, { status });

    if (uErr) {
      console.error("[mis-anuncios/editar]", uErr.message);
      setError(dashboardSafeMutationErrorCopy(lang));
      setBusyAction(null);
      return;
    }

    setListing((prev: any) => ({ ...(prev || {}), status }));
    setBusyAction(null);
  }

  async function archiveListing() {
    if (!id || !isValidUuid(id)) {
      router.replace("/dashboard/mis-anuncios");
      return;
    }
    if (!confirm(L.confirmArchive)) return;

    const supabase = createSupabaseBrowserClient();

    setBusyAction("archive");
    setError(null);

    const now = new Date().toISOString();
    const patch = { ...OWNER_LISTING_SOFT_ARCHIVE_PATCH, updated_at: now };

    const { error: dErr } = await applyOwnerListingPatch(supabase, id, userId, patch);

    if (dErr) {
      console.error("[mis-anuncios/editar]", dErr.message);
      setError(dashboardSafeMutationErrorCopy(lang));
      setBusyAction(null);
      return;
    }

    router.replace(`/dashboard/mis-anuncios?lang=${lang}`);
  }

  const status = String(listing?.status || "active").toLowerCase();
  const isSold = status === "sold";
  const listingId = String(id ?? "");
  const publicListingHref =
    listing && String(listing.category ?? "").toLowerCase() === "rentas"
      ? withRentasLandingLang(rentasListingPublicPath(listingId), lang)
      : `/clasificados/anuncio/${listingId}?lang=${lang}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-yellow-400">{L.title}</h1>
            <p className="mt-2 text-gray-300">ID: {id}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={publicListingHref}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {L.view}
            </Link>
            <Link
              href={`/dashboard/mis-anuncios?lang=${lang}`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              {L.back}
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
          {loading ? <div className="text-white/70">{L.loading}</div> : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <div className="text-base font-semibold text-red-200">{L.errorTitle}</div>
              <p className="mt-2 text-sm text-red-100/80">{error}</p>
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-100">
              {success}
            </div>
          ) : null}

          {!loading && listing ? (
            <>
              {!isEditable ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-base font-semibold text-white">{L.lockedTitle}</div>
                  <p className="mt-2 text-sm text-white/70">{L.lockedBody}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm text-white/70">{L.fieldsTitle}</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditable || saving}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-white/70">{L.fieldsPrice}</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={!isEditable || saving}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                  />
                </label>

                {listing && "description" in listing ? (
                  <label className="grid gap-2">
                    <span className="text-sm text-white/70">{L.fieldsDesc}</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditable || saving}
                      rows={5}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-500/40 disabled:opacity-60"
                    />
                  </label>
                ) : null}

<div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-sm font-semibold text-white/90">{L.photos}</div>
      <div className="text-xs text-white/60 mt-1">{L.photosHelp}</div>
    </div>
  </div>

  <div className="mt-3 flex flex-wrap items-center gap-3">
    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/90 hover:bg-black/50 transition">
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          setSelectedFiles(files);
        }}
        disabled={uploading}
      />
      {L.addPhotos}
    </label>

    <button
      type="button"
      onClick={uploadImages}
      disabled={uploading || selectedFiles.length === 0}
      className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition disabled:opacity-50"
    >
      {uploading ? L.uploading : L.upload}
    </button>

    {uploadNote ? (
      <span className="text-xs text-yellow-200/90">{uploadNote}</span>
    ) : null}
  </div>

  {selectedFiles.length > 0 ? (
    <div className="mt-3 text-xs text-white/60">
      {selectedFiles.length} {lang === "es" ? "archivo(s) seleccionados" : "file(s) selected"}
    </div>
  ) : null}

  {getListingImageUrls(listing?.images).length > 0 ? (
    /* Globalization Package B (Gate B2) — the gallery is now MANAGEABLE, not read-only:
       remove, reorder, and cover selection persist the full final ordered set through the
       same owner-scoped patch. No display cap (previously silently sliced to 8). Index 0 is
       the cover — the listings-family convention every public shell renders. */
    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
      {getListingImageUrls(listing?.images).map((url, index, all) => (
        <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
          { }
          <img src={url} alt={index === 0 ? (lang === "es" ? "Portada" : "Cover") : "photo"} className="h-full w-full object-cover" />
          {index === 0 ? (
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              {lang === "es" ? "Portada" : "Cover"}
            </span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 py-1 opacity-90">
            <button
              type="button"
              disabled={mediaActionBusy || index === 0}
              onClick={() => void moveImage(index, -1)}
              aria-label={lang === "es" ? "Mover antes" : "Move earlier"}
              className="rounded px-1.5 text-xs text-white/90 hover:bg-white/15 disabled:opacity-30"
            >
              ◀
            </button>
            <button
              type="button"
              disabled={mediaActionBusy || index === all.length - 1}
              onClick={() => void moveImage(index, 1)}
              aria-label={lang === "es" ? "Mover después" : "Move later"}
              className="rounded px-1.5 text-xs text-white/90 hover:bg-white/15 disabled:opacity-30"
            >
              ▶
            </button>
            {index !== 0 ? (
              <button
                type="button"
                disabled={mediaActionBusy}
                onClick={() => void makeHeroImage(index)}
                className="rounded px-1.5 text-[10px] font-semibold text-amber-200 hover:bg-white/15 disabled:opacity-30"
              >
                {lang === "es" ? "Portada" : "Cover"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={mediaActionBusy}
              onClick={() => void removeImageAt(index)}
              aria-label={lang === "es" ? "Quitar foto" : "Remove photo"}
              className="rounded px-1.5 text-xs font-bold text-red-300 hover:bg-white/15 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : null}
</div>

{isBrPrivadoListing ? (
  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
    <div className="text-sm font-semibold text-white/90">
      {lang === "es" ? "Foto del vendedor" : "Seller photo"}
    </div>
    <div className="text-xs text-white/60 mt-1">
      {lang === "es"
        ? "Se muestra junto a tu nombre en el anuncio publicado. Opcional."
        : "Shown next to your name on the published listing. Optional."}
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-3">
      {sellerPhotoUrl ? (
        <img
          src={sellerPhotoUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-full border border-white/10 object-cover"
        />
      ) : null}
      <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/90 hover:bg-black/50 transition">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={sellerPhotoUploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadSellerPhoto(f);
          }}
        />
        {sellerPhotoUrl
          ? lang === "es"
            ? "Reemplazar foto"
            : "Replace photo"
          : lang === "es"
            ? "Subir foto"
            : "Upload photo"}
      </label>
      {sellerPhotoUrl ? (
        <button
          type="button"
          onClick={removeSellerPhoto}
          disabled={sellerPhotoUploading}
          className="text-xs font-semibold text-white/70 underline hover:text-white/90 disabled:opacity-50"
        >
          {lang === "es" ? "Quitar foto" : "Remove photo"}
        </button>
      ) : null}
      {sellerPhotoUploading ? (
        <span className="text-xs text-yellow-200/90">{lang === "es" ? "Guardando…" : "Saving…"}</span>
      ) : null}
    </div>
    {sellerPhotoError ? <p className="mt-2 text-xs font-semibold text-red-300">{sellerPhotoError}</p> : null}
  </div>
) : null}


                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={save}
                    disabled={!isEditable || saving}
                    className="inline-flex items-center justify-center rounded-full bg-yellow-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-50"
                  >
                    {saving ? L.saving : L.save}
                  </button>

                  {isSold ? (
                    <button
                      onClick={() => markStatus("active")}
                      disabled={busyAction !== null}
                      className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition disabled:opacity-50"
                    >
                      {busyAction ? "…" : L.markActive}
                    </button>
                  ) : (
                    <button
                      onClick={() => markStatus("sold")}
                      disabled={busyAction !== null}
                      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
                    >
                      {busyAction ? "…" : L.markSold}
                    </button>
                  )}

                  <button
                    onClick={archiveListing}
                    disabled={busyAction !== null}
                    className="inline-flex items-center rounded-full border border-stone-400/50 bg-stone-500/15 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-500/25 transition disabled:opacity-50"
                  >
                    {busyAction === "archive" ? L.archiving : L.archive}
                  </button>
                </div>

                <div className="text-xs text-white/50">
                  {createdIso ? `created_at: ${createdIso}` : ""}
                  {mins !== null ? ` · ${Math.max(0, Math.floor(mins))} min` : ""}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EditListingPageContent />
    </Suspense>
  );
}
