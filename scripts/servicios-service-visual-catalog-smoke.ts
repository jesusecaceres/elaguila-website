/**
 * Phase 2A — Servicios service visual catalog smoke (runs in `npx tsx`, no server).
 */
import { resolveServiciosServiceVisual } from "../app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const v = resolveServiciosServiceVisual;
  assert(v({ id: "svc_plom_fugas", label: "Reparación de fugas" }).emoji === "🔧", "plomería fugas");
  assert(v({ id: "svc_plom_destape" }).emoji === "🚿", "destape");
  assert(v({ id: "svc_plom_calentador" }).emoji === "🚿", "calentador");
  assert(v({ id: "svc_elec_instalacion" }).emoji === "⚡", "electricista instalación");
  assert(v({ id: "svc_elec_reparacion" }).emoji === "⚡", "electricista reparación");
  assert(v({ id: "svc_elec_emergencia" }).emoji === "⚡", "electricista emergencia");
  assert(v({ id: "svc_elec_celulares", businessTypeId: "reparacion_electronicos" }).emoji === "📱", "celulares");
  assert(v({ id: "svc_elec_computadoras", businessTypeId: "reparacion_electronicos" }).emoji === "💻", "computadoras");
  assert(v({ id: "svc_pel_corte", businessTypeId: "peluqueria_barberia" }).emoji === "✂️", "corte");
  assert(v({ id: "svc_pel_barberia", businessTypeId: "peluqueria_barberia" }).emoji === "✂️", "barbería");
  assert(v({ id: "svc_trad_legal", businessTypeId: "traduccion_documentos" }).emoji === "🌐", "trad legal");
  assert(v({ id: "svc_trad_certificada", businessTypeId: "traduccion_documentos" }).emoji === "🌐", "trad certificada");
  assert(v({ label: "reparación de iPhone" }).emoji === "📱", "custom iphone");
  assert(v({ label: "limpieza de oficinas" }).emoji === "🧹", "custom limpieza");
  assert(v({ label: "zz_unknown_token_yy" }).emoji === "🛠️", "unknown fallback");
  assert(
    v({ id: "svc_carp_reparacion", label: "Reparación de muebles" }).emoji === "🪚",
    "carp_reparacion carpintería",
  );
  assert(
    v({ id: "svc_carp_reparacion", label: "Reparación de carrocería" }).emoji === "🚗",
    "carp_reparacion carrocería",
  );

  console.log("[servicios-service-visual-catalog-smoke] OK");
}

main();
