"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { isCatalogSlugTaken } from "@/app/admin/_lib/tiendaCatalogAdminData";
import {
  isTiendaCatalogCtaMode,
  isTiendaCatalogPricingMode,
} from "@/app/lib/tienda/tiendaCatalogTypes";

async function assertAdmin(): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function boolForm(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

/** Select yes/no — empty defaults to true (contact prefs). */
function yesDefaultTrueForm(v: FormDataEntryValue | null): boolean {
  const s = strForm(v).toLowerCase();
  if (s === "false" || s === "0" || s === "no") return false;
  return true;
}

function strForm(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function optionalStr(v: FormDataEntryValue | null): string | null {
  const s = strForm(v);
  return s.length ? s : null;
}

function parseMetaJson(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (o && typeof o === "object" && !Array.isArray(o)) return o as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return {};
}

export async function createTiendaCatalogItemAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = strForm(formData.get("slug")).toLowerCase();
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug (lowercase letters, numbers, hyphens only).");
  if (await isCatalogSlugTaken(slug)) throw new Error("Slug already in use.");

  const pricing_mode = strForm(formData.get("pricing_mode"));
  const cta_mode = strForm(formData.get("cta_mode"));
  if (!isTiendaCatalogPricingMode(pricing_mode)) throw new Error("Invalid pricing mode.");
  if (!isTiendaCatalogCtaMode(cta_mode)) throw new Error("Invalid CTA mode.");

  const basePriceRaw = strForm(formData.get("base_price"));
  const base_price = basePriceRaw ? Number(basePriceRaw) : null;
  if (base_price != null && !Number.isFinite(base_price)) throw new Error("Invalid base price.");

  const row = {
    title_es: strForm(formData.get("title_es")) || "—",
    title_en: strForm(formData.get("title_en")) || "—",
    slug,
    category_slug: strForm(formData.get("category_slug")) || "promo-products",
    subcategory_slug: optionalStr(formData.get("subcategory_slug")),
    short_description_es: strForm(formData.get("short_description_es")),
    short_description_en: strForm(formData.get("short_description_en")),
    description_es: strForm(formData.get("description_es")),
    description_en: strForm(formData.get("description_en")),
    pricing_mode,
    price_label: optionalStr(formData.get("price_label")),
    price_note: optionalStr(formData.get("price_note")),
    base_price,
    cta_mode,
    is_featured: boolForm(formData.get("is_featured")),
    is_live: boolForm(formData.get("is_live")),
    is_hidden: boolForm(formData.get("is_hidden")),
    sort_order: Number(strForm(formData.get("sort_order")) || "0") || 0,
    badge_label: optionalStr(formData.get("badge_label")),
    specialty_flag: boolForm(formData.get("specialty_flag")),
    storefront_visible: boolForm(formData.get("storefront_visible")),
    category_visible: boolForm(formData.get("category_visible")),
    office_preferred: yesDefaultTrueForm(formData.get("office_preferred")),
    phone_preferred: yesDefaultTrueForm(formData.get("phone_preferred")),
    email_allowed: yesDefaultTrueForm(formData.get("email_allowed")),
    linked_product_slug: optionalStr(formData.get("linked_product_slug")),
    meta: parseMetaJson(strForm(formData.get("meta_json"))),
    updated_at: new Date().toISOString(),
  };

  const supabase = getAdminSupabase();
  const { data: inserted, error } = await supabase.from("tienda_catalog_items").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  const id = String((inserted as { id: string }).id);

  const imgUrl = strForm(formData.get("primary_image_url"));
  if (imgUrl) {
    await supabase.from("tienda_catalog_images").insert({
      item_id: id,
      image_url: imgUrl,
      alt_es: strForm(formData.get("primary_image_alt_es")),
      alt_en: strForm(formData.get("primary_image_alt_en")),
      sort_order: 0,
      is_primary: true,
    });
  }

  auditAdminWrite("tienda_catalog_item_created", "tienda_catalog_items", id, { slug });
  revalidatePath("/admin/tienda/catalog");
  revalidatePath("/tienda");
  revalidatePath("/tienda/c", "layout");
  redirect(`/admin/tienda/catalog/${id}`);
}

export async function updateTiendaCatalogItemAction(itemId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const slug = strForm(formData.get("slug")).toLowerCase();
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug.");
  if (await isCatalogSlugTaken(slug, itemId)) throw new Error("Slug already in use.");

  const pricing_mode = strForm(formData.get("pricing_mode"));
  const cta_mode = strForm(formData.get("cta_mode"));
  if (!isTiendaCatalogPricingMode(pricing_mode)) throw new Error("Invalid pricing mode.");
  if (!isTiendaCatalogCtaMode(cta_mode)) throw new Error("Invalid CTA mode.");

  const basePriceRaw = strForm(formData.get("base_price"));
  const base_price = basePriceRaw ? Number(basePriceRaw) : null;
  if (base_price != null && !Number.isFinite(base_price)) throw new Error("Invalid base price.");

  const patch = {
    title_es: strForm(formData.get("title_es")) || "—",
    title_en: strForm(formData.get("title_en")) || "—",
    slug,
    category_slug: strForm(formData.get("category_slug")) || "promo-products",
    subcategory_slug: optionalStr(formData.get("subcategory_slug")),
    short_description_es: strForm(formData.get("short_description_es")),
    short_description_en: strForm(formData.get("short_description_en")),
    description_es: strForm(formData.get("description_es")),
    description_en: strForm(formData.get("description_en")),
    pricing_mode,
    price_label: optionalStr(formData.get("price_label")),
    price_note: optionalStr(formData.get("price_note")),
    base_price,
    cta_mode,
    is_featured: boolForm(formData.get("is_featured")),
    is_live: boolForm(formData.get("is_live")),
    is_hidden: boolForm(formData.get("is_hidden")),
    sort_order: Number(strForm(formData.get("sort_order")) || "0") || 0,
    badge_label: optionalStr(formData.get("badge_label")),
    specialty_flag: boolForm(formData.get("specialty_flag")),
    storefront_visible: boolForm(formData.get("storefront_visible")),
    category_visible: boolForm(formData.get("category_visible")),
    office_preferred: yesDefaultTrueForm(formData.get("office_preferred")),
    phone_preferred: yesDefaultTrueForm(formData.get("phone_preferred")),
    email_allowed: yesDefaultTrueForm(formData.get("email_allowed")),
    linked_product_slug: optionalStr(formData.get("linked_product_slug")),
    meta: parseMetaJson(strForm(formData.get("meta_json"))),
    updated_at: new Date().toISOString(),
  };

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("tienda_catalog_items").update(patch).eq("id", itemId);
  if (error) throw new Error(error.message);

  auditAdminWrite("tienda_catalog_item_updated", "tienda_catalog_items", itemId, { slug });
  revalidatePath("/admin/tienda/catalog");
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
  revalidatePath("/tienda");
  revalidatePath("/tienda/c", "layout");
  revalidatePath(`/tienda/catalog/${slug}`);
}

export async function addTiendaCatalogImageAction(itemId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const url = strForm(formData.get("image_url"));
  if (!url) throw new Error("Image URL required.");
  const supabase = getAdminSupabase();
  const { count } = await supabase
    .from("tienda_catalog_images")
    .select("id", { count: "exact", head: true })
    .eq("item_id", itemId);
  const sort = typeof count === "number" ? count : 0;
  const { error } = await supabase.from("tienda_catalog_images").insert({
    item_id: itemId,
    image_url: url,
    alt_es: strForm(formData.get("alt_es")),
    alt_en: strForm(formData.get("alt_en")),
    sort_order: sort,
    is_primary: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
  revalidatePath("/tienda");
}

export async function setTiendaCatalogPrimaryImageAction(itemId: string, imageId: string): Promise<void> {
  await assertAdmin();
  const supabase = getAdminSupabase();
  await supabase.from("tienda_catalog_images").update({ is_primary: false }).eq("item_id", itemId);
  const { error } = await supabase.from("tienda_catalog_images").update({ is_primary: true }).eq("id", imageId).eq("item_id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
  revalidatePath("/tienda");
}

export async function deleteTiendaCatalogImageAction(itemId: string, imageId: string): Promise<void> {
  await assertAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("tienda_catalog_images").delete().eq("id", imageId).eq("item_id", itemId);
  if (error) throw new Error(error.message);
  auditAdminWrite("tienda_catalog_image_deleted", "tienda_catalog_images", imageId, { item_id: itemId });
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
  revalidatePath("/tienda");
}

export async function addTiendaCatalogPricingRuleAction(itemId: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const price = Number(strForm(formData.get("price")));
  if (!Number.isFinite(price)) throw new Error("Invalid price.");
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("tienda_catalog_pricing_rules").insert({
    item_id: itemId,
    rule_type: strForm(formData.get("rule_type")) || "quantity_tier",
    quantity_min: strForm(formData.get("quantity_min")) ? Number(strForm(formData.get("quantity_min"))) : null,
    quantity_max: strForm(formData.get("quantity_max")) ? Number(strForm(formData.get("quantity_max"))) : null,
    size_key: optionalStr(formData.get("size_key")),
    stock_key: optionalStr(formData.get("stock_key")),
    finish_key: optionalStr(formData.get("finish_key")),
    sides_key: optionalStr(formData.get("sides_key")),
    price,
    sort_order: Number(strForm(formData.get("sort_order")) || "0") || 0,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
}

export async function deleteTiendaCatalogPricingRuleAction(itemId: string, ruleId: string): Promise<void> {
  await assertAdmin();
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("tienda_catalog_pricing_rules").delete().eq("id", ruleId).eq("item_id", itemId);
  if (error) throw new Error(error.message);
  auditAdminWrite("tienda_catalog_pricing_rule_deleted", "tienda_catalog_pricing_rules", ruleId, { item_id: itemId });
  revalidatePath(`/admin/tienda/catalog/${itemId}`);
}
