/**
 * Empleos publish ↔ admin / generic listings (directional notes; no live publish yet).
 *
 * The workspace listings table (`app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx`)
 * expects rows with at least: `id`, `title`, `description`, `city`, `category`, `price`, `is_free`,
 * `status`, `owner_id`, `created_at`, `images`, `detail_pairs`, `is_published`, etc.
 *
 * When Empleos persists to the same `listings` (or successor) contract:
 * - Set `category` to the hub key for jobs (e.g. `empleos`) consistently with other categories.
 * - Map owner → `owner_id`; workflow state → `status`; draft timestamps → `created_at` / future `published_at`.
 * - Serialize hero/gallery from application state into `images` (JSON/array) like other lanes.
 * - Optional structured fields can live in `detail_pairs` if the stack continues that pattern.
 *
 * Session-only drafts (`useEmpleosDraftSession`) are not admin-visible until a publish API exists.
 */

import type { EmpleosLane, EmpleosListingLifecycleStatus } from "../publish/empleosListingLifecycle";
import type { EmpleosPaymentHandoffPlaceholder } from "../publish/empleosPaymentHandoff";

/**
 * Projection of a future persisted row aligned with `EmpleosPublishEnvelope` for admin lists.
 */
export type EmpleosAdminListingRowProjection = {
  id: string | null;
  owner_id: string | null;
  category: "empleos";
  lane: EmpleosLane;
  status: EmpleosListingLifecycleStatus;
  title: string;
  description: string;
  city: string;
  state: string;
  primary_image_url: string | null;
  images: string[];
  detail_pairs: Record<string, string>;
  cta_summary: string;
  payment_state: EmpleosPaymentHandoffPlaceholder["paymentState"];
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  moderation_meta: { lane: EmpleosLane; language: string } | null;
};
