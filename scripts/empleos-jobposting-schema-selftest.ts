/**
 * Validates JobPosting JSON-LD builder + absolute public URL helper (no DB, no network).
 * Run: npx tsx scripts/empleos-jobposting-schema-selftest.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { strict as assert } from "node:assert";

process.env.NEXT_PUBLIC_SITE_URL = "https://empleos-selftest.example";

import type { EmpleosJobRecord } from "../app/(site)/clasificados/empleos/data/empleosJobTypes";
import { buildEmpleosJobPostingJsonLdObject, validateEmpleosJobPostingJsonLdObject } from "../app/(site)/clasificados/empleos/lib/empleosJobPostingSchema";
import { empleosJobPublicAbsoluteUrl } from "../app/(site)/clasificados/empleos/lib/empleosSiteUrl";

const job: EmpleosJobRecord = {
  id: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
  slug: "cocinero-austin-tx",
  title: "Cocinero",
  company: "Café Demo",
  city: "Austin",
  state: "TX",
  postalCode: "78701",
  category: "restaurantes",
  modality: "presencial",
  jobType: "tiempo-completo",
  salaryMin: 40000,
  salaryMax: 52000,
  salaryLabel: "$40k–$52k",
  experience: "mid",
  companyType: "small",
  quickApply: true,
  publishedAt: "2026-04-01T12:00:00.000Z",
  listingTier: "standard",
  verifiedEmployer: false,
  premiumEmployer: false,
  companyInitials: "CD",
  imageSrc: "https://example.com/hero.jpg",
  imageAlt: "Kitchen",
  summary: "Cocinero de línea en café.",
  description: "Preparación, mise en place, limpieza HACCP.",
  requirements: ["1 año experiencia"],
  benefits: ["Propinas"],
  benefitChips: ["Propinas"],
  showOnLandingFeatured: false,
  showOnLandingRecent: false,
};

const obj = buildEmpleosJobPostingJsonLdObject(job, "es");
const errs = validateEmpleosJobPostingJsonLdObject(obj);
assert.equal(errs.length, 0, `schema validation: ${errs.join("; ")}`);
assert.equal(
  empleosJobPublicAbsoluteUrl(job.slug, "es"),
  "https://empleos-selftest.example/clasificados/empleos/cocinero-austin-tx",
);
assert.equal(
  empleosJobPublicAbsoluteUrl(job.slug, "en"),
  "https://empleos-selftest.example/clasificados/empleos/cocinero-austin-tx?lang=en",
);

const mig = readFileSync(join(process.cwd(), "supabase/migrations/20260410220000_empleos_listing_metrics.sql"), "utf8");
assert.match(mig, /apply_count/i);
assert.match(mig, /view_count/i);

console.log("empleos-jobposting-schema-selftest: ok");
