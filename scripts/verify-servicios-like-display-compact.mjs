#!/usr/bin/env node
/**
 * Servicios Like display compact patch — count + heart only; no Te gusta / me gusta visible text.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cluster = read("app/(site)/servicios/components/ServiciosLikeEngagementCluster.tsx");
const badge = read("app/(site)/servicios/components/ServiciosLikeCountBadge.tsx");
const strip = read("app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx");
const pkg = read("package.json");

assert(cluster.includes('countDisplay="numeric"'), "cluster: numeric count display");
assert(cluster.includes("numericShowZero"), "cluster: shows zero count");
assert(cluster.includes("previewLabelMode=\"iconOnly\""), "cluster: no visible Te gusta/Me gusta");
assert(cluster.includes("likeCount={likeCueN}"), "cluster: real count prop");
assert(cluster.includes("recordLikeEvent={recordLikeEvent}"), "cluster: analytics hook preserved");
assert(!cluster.includes("data-servicios-like-cluster-count"), "cluster: split count pill removed");
assert(!cluster.includes("me gusta"), "cluster: no visible me gusta");
assert(!cluster.includes("Te gusta"), "cluster: no visible Te gusta");
assert(cluster.includes("data-servicios-like-compact"), "cluster: compact marker");

assert(badge.includes("tabular-nums"), "badge: numeric count");
assert(badge.includes("FaHeart"), "badge: heart icon");
assert(!badge.includes(">me gusta<"), "badge: no visible me gusta text");
assert(badge.includes("aria-label"), "badge: accessible label");

assert(strip.includes("ServiciosLikeEngagementCluster"), "results strip: shared cluster");
assert(strip.includes("LeonixShareButton"), "results strip: share still wired");

assert(pkg.includes('"verify:servicios-like-display-compact"'), "package.json: verifier registered");

console.log("OK: Servicios Like is count + heart only");
console.log("OK: Te gusta / me gusta visible wording removed from cluster");
console.log("verify-servicios-like-display-compact: PASS");
