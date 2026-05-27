/**
 * Phase 10 — truthful admin edit/manage standard per Clasificados ad source.
 * Pure data + URL resolution; no DB writes.
 */

import type { AdminAdSource, AdminNormalizedAd } from "./adminAdIdentity";

export type AdminEditSupportStatus = "TRUE_EDIT" | "MANAGE_ONLY" | "SAFE_SKIP" | "MISSING";

export function adminEditSupportStatusLabelEs(s: AdminEditSupportStatus): string {
  switch (s) {
    case "TRUE_EDIT":
      return "Edición staff (misma fila)";
    case "MANAGE_ONLY":
      return "Solo gestión / moderación (staff)";
    case "SAFE_SKIP":
      return "Sin ruta unificada";
    case "MISSING":
      return "Sin cola admin";
  }
}

export type AdminAdResolvedActions = {
  publicUrl: string;
  /** Primary Leonix workspace / queue URL for this row (moderation, visibility, status). */
  adminManageUrl: string;
  /** Admin-authenticated content edit on the same row, preserving owner and ids. None today. */
  adminEditUrl: string | null;
  /** Same as adminManageUrl when the workspace row supports status/moderation actions. */
  manageStatusUrl: string | null;
  editSupportStatus: AdminEditSupportStatus;
  editSupportNote: string;
  /** Seller dashboard / self-service URL; only valid when the owner is logged in (not staff acting as owner). */
  sellerSelfServiceUrl: string | null;
};

/** Per-source classification (inspectable for audits and UI copy). */
export const ADMIN_EDIT_SUPPORT_BY_SOURCE: Record<
  AdminAdSource,
  { editSupportStatus: AdminEditSupportStatus; editSupportNote: string }
> = {
  generic: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola /admin/workspace/clasificados — publicar, ocultar o marcar eliminado en la misma fila listings; inspector Rentas solo lectura. La edición de título/descripción/imágenes valida owner_id en /dashboard/mis-anuncios/…/editar (sesión del anunciante).",
  },
  restaurantes: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola Restaurantes — suspender, destacar, verificar Leonix vía API admin en la misma fila; sin editor de contenido para staff. El negocio edita en su flujo de publicación.",
  },
  servicios: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola Servicios — estado, verificación y revisiones en la misma fila servicios_public_listings; sin editor de perfil para staff desde Leonix.",
  },
  empleos: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola Empleos — ciclo de vida y moderación vía API admin en la misma fila. El panel /dashboard/empleos/… valida propietario en API para cambios; sesión staff no sustituye al anunciante.",
  },
  autos: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola Autos — vista operativa y enlace público; sin mutación de contenido en esta cola. El anunciante gestiona el listado de pago en su cuenta (Mis anuncios / flujo Autos).",
  },
  viajes: {
    editSupportStatus: "MANAGE_ONLY",
    editSupportNote:
      "Staff: cola Viajes (travel) — moderación y visibilidad en viajes_staged_listings; el anunciante gestiona en /dashboard/viajes.",
  },
};

function empleosLangFromAd(ad: AdminNormalizedAd): "es" | "en" {
  const raw = ad.sourceMeta?.lang;
  if (typeof raw === "string" && raw.trim().toLowerCase() === "en") return "en";
  return "es";
}

function sellerSelfServiceUrlForSource(ad: AdminNormalizedAd): string | null {
  switch (ad.source) {
    case "generic":
      return `/dashboard/mis-anuncios/${encodeURIComponent(ad.internalId)}/editar`;
    case "empleos": {
      const l = empleosLangFromAd(ad);
      return `/dashboard/empleos/${encodeURIComponent(ad.internalId)}?lang=${l}`;
    }
    case "viajes":
      return `/dashboard/viajes?lang=es`;
    default:
      return null;
  }
}

/**
 * Resolves honest action URLs and support classification for one normalized ad (user command center, tooling).
 */
export function resolveAdminAdActions(ad: AdminNormalizedAd): AdminAdResolvedActions {
  const meta = ADMIN_EDIT_SUPPORT_BY_SOURCE[ad.source];
  const sellerSelfServiceUrl = sellerSelfServiceUrlForSource(ad);

  return {
    publicUrl: ad.publicUrl,
    adminManageUrl: ad.adminUrl,
    /** No source is TRUE_EDIT yet; staff must not imply in-app “edit as admin” until a guarded mutation exists. */
    adminEditUrl: null,
    manageStatusUrl: meta.editSupportStatus === "MANAGE_ONLY" ? ad.adminUrl : null,
    editSupportStatus: meta.editSupportStatus,
    editSupportNote: meta.editSupportNote,
    sellerSelfServiceUrl,
  };
}
