import type { ServiciosServiceVisualVariant } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Map preset chip id + labels to a Leonix-controlled service card variant (no uploaded photo required).
 */
export function inferServiceVisualVariant(chipId: string, titleEs: string, titleEn: string): ServiciosServiceVisualVariant {
  const hay = `${chipId} ${titleEs} ${titleEn}`.toLowerCase();

  if (/(emergencia|emergency|24\/7|urgent|24-7|minutos)/.test(hay)) return "emergencia";
  if (/(instal|install|grifer|fixture|luminar|lighting|panel|paneles|ilumin|deck|exterior)/.test(hay)) {
    return "instalacion";
  }
  if (/(manten|mainten|inspecc|inspect|revisi[oó]n|limpieza|cleaning|gesti[oó]n)/.test(hay)) {
    return "mantenimiento";
  }
  if (/(repar|repair|fuga|leak|destape|drain|cerraj|lock|duplic|remodel|adiciones|baños|baos|cocinas)/.test(hay)) {
    return "reparacion";
  }
  if (/(consult|cotiz|quote|estimate|estim|visita|proyecto|general|resid|comer|comercial)/.test(hay)) {
    return "consulta";
  }

  return "default";
}
