/**
 * Staff master application launcher — UI routing only.
 *
 * Reuses existing category maps, pricing matrix, Quick/Full pair authority, and public
 * checkpoints. Does not invent a second application or a second price book.
 */
import {
  formatRevenuePriceLabel,
  getRevenuePackageDefinition,
} from "@/app/lib/listingPlans/revenuePricingMatrix";
import { withQuickPlanParam } from "@/app/lib/listingPlans/businessQuickPlanSignal";
import {
  QUICK_SALES_CATEGORY_MAP,
  isQuickSalesCategory,
  type QuickSalesCategory,
} from "./quickSalesCategories";
import {
  STAFF_CATEGORY_PRICED_PACKAGE_KEYS,
  isStaffBusinessPairCategory,
  staffBusinessOffers,
  type StaffBusinessPlan,
} from "./staffBusinessProduct";

export const STAFF_LAUNCHER_GROUPS = ["clasificados", "negocios", "ofertas", "otros"] as const;
export type StaffLauncherGroup = (typeof STAFF_LAUNCHER_GROUPS)[number];

export type StaffLauncherMode = "assisted" | "admin" | "open";

export type StaffLauncherProduct = {
  id: string;
  labelEs: string;
  labelEn: string;
  plan?: StaffBusinessPlan | "flyer" | "coupon" | "negocio" | "privado";
  packageKey?: string;
  staffHref?: string;
  customerHref?: string;
};

export type StaffLauncherItem = {
  id: string;
  group: StaffLauncherGroup;
  labelEs: string;
  labelEn: string;
  mode: StaffLauncherMode;
  assistedCategory?: QuickSalesCategory;
  staffHref: string;
  customerHref: string | null;
  customerCheckpointHref: string | null;
  hasQuickFull: boolean;
  publicCreationAllowed: boolean;
  staffOnly: boolean;
  customerQuickLink: boolean;
  products: StaffLauncherProduct[];
};

const EIGHT_QUICK_CUSTOMER: readonly string[] = [
  "rentas",
  "empleos",
  "autos-privado",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos",
  "bienes-raices",
];

function priceFor(packageKey: string): string {
  const def = getRevenuePackageDefinition(packageKey);
  return def ? formatRevenuePriceLabel(def.priceCents) : "";
}

function pairProducts(category: QuickSalesCategory, intake: string): StaffLauncherProduct[] {
  return staffBusinessOffers(category).map((offer) => ({
    id: offer.plan,
    labelEs: offer.plan === "quick" ? "Quick Business" : "Full Business",
    labelEn: offer.plan === "quick" ? "Quick Business" : "Full Business",
    plan: offer.plan,
    packageKey: offer.packageKey,
    staffHref: offer.plan === "quick" ? withQuickPlanParam(intake) : intake,
    customerHref: offer.plan === "quick" ? withQuickPlanParam(intake) : intake,
  }));
}

function singleProduct(input: {
  id: string;
  labelEs: string;
  labelEn: string;
  packageKey?: string;
  href: string;
}): StaffLauncherProduct[] {
  return [
    {
      id: input.id,
      labelEs: input.labelEs,
      labelEn: input.labelEn,
      packageKey: input.packageKey,
      staffHref: input.href,
      customerHref: input.href,
    },
  ];
}

export const STAFF_MASTER_LAUNCHER_ITEMS: readonly StaffLauncherItem[] = [
  {
    id: "en-venta",
    group: "clasificados",
    labelEs: "En Venta / Varios",
    labelEn: "For Sale / Various",
    mode: "open",
    staffHref: "/clasificados/publicar/en-venta/pro",
    customerHref: "/publicar/en-venta",
    customerCheckpointHref: "/publicar/en-venta",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({
      id: "en-venta",
      labelEs: "En Venta",
      labelEn: "For Sale",
      packageKey: "en_venta_free_v1",
      href: "/clasificados/publicar/en-venta/pro",
    }),
  },
  {
    id: "rentas",
    group: "clasificados",
    labelEs: "Rentas",
    labelEn: "Rentals",
    mode: "assisted",
    assistedCategory: "rentas",
    staffHref: QUICK_SALES_CATEGORY_MAP.rentas.intakePath,
    customerHref: "/clasificados/publicar/rentas",
    customerCheckpointHref: "/clasificados/publicar/rentas",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: singleProduct({
      id: "rentas",
      labelEs: "Publicar renta",
      labelEn: "Publish rental",
      packageKey: STAFF_CATEGORY_PRICED_PACKAGE_KEYS.rentas,
      href: QUICK_SALES_CATEGORY_MAP.rentas.intakePath,
    }),
  },
  {
    id: "empleos",
    group: "clasificados",
    labelEs: "Empleos",
    labelEn: "Jobs",
    mode: "assisted",
    assistedCategory: "empleos",
    staffHref: QUICK_SALES_CATEGORY_MAP.empleos.intakePath,
    customerHref: "/publicar/empleos",
    customerCheckpointHref: "/publicar/empleos",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: singleProduct({
      id: "empleos",
      labelEs: "Empleo pagado",
      labelEn: "Paid job post",
      packageKey: STAFF_CATEGORY_PRICED_PACKAGE_KEYS.empleos,
      href: QUICK_SALES_CATEGORY_MAP.empleos.intakePath,
    }),
  },
  {
    id: "autos-privado",
    group: "clasificados",
    labelEs: "Autos privados",
    labelEn: "Private autos",
    mode: "assisted",
    assistedCategory: "autos-privado",
    staffHref: QUICK_SALES_CATEGORY_MAP["autos-privado"].intakePath,
    customerHref: "/clasificados/publicar/autos",
    customerCheckpointHref: "/clasificados/publicar/autos",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: singleProduct({
      id: "autos-privado",
      labelEs: "Auto privado",
      labelEn: "Private auto",
      packageKey: STAFF_CATEGORY_PRICED_PACKAGE_KEYS["autos-privado"],
      href: QUICK_SALES_CATEGORY_MAP["autos-privado"].intakePath,
    }),
  },
  {
    id: "bienes-fsbo",
    group: "clasificados",
    labelEs: "Bienes Raíces FSBO",
    labelEn: "Real Estate FSBO",
    mode: "open",
    staffHref: "/publicar/bienes-raices/privado",
    customerHref: "/clasificados/publicar/bienes-raices",
    customerCheckpointHref: "/clasificados/publicar/bienes-raices",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({
      id: "bienes-fsbo",
      labelEs: "Dueño directo",
      labelEn: "Owner direct",
      packageKey: "br_fsbo_45d",
      href: "/publicar/bienes-raices/privado",
    }),
  },
  {
    id: "busco",
    group: "clasificados",
    labelEs: "Busco / Se Busca",
    labelEn: "Wanted",
    mode: "open",
    staffHref: "/publicar/busco/quick",
    customerHref: "/publicar/busco",
    customerCheckpointHref: "/publicar/busco",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({ id: "busco", labelEs: "Busco", labelEn: "Wanted", packageKey: "busco_free", href: "/publicar/busco/quick" }),
  },
  {
    id: "clases",
    group: "clasificados",
    labelEs: "Clases",
    labelEn: "Classes",
    mode: "open",
    staffHref: "/publicar/clases/quick",
    customerHref: "/publicar/clases",
    customerCheckpointHref: "/publicar/clases",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({ id: "clases", labelEs: "Clases", labelEn: "Classes", packageKey: "clases_free", href: "/publicar/clases/quick" }),
  },
  {
    id: "comunidad",
    group: "clasificados",
    labelEs: "Comunidad y Eventos",
    labelEn: "Community & Events",
    mode: "open",
    staffHref: "/publicar/comunidad/quick",
    customerHref: "/publicar/comunidad",
    customerCheckpointHref: "/publicar/comunidad",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({
      id: "comunidad",
      labelEs: "Comunidad",
      labelEn: "Community",
      packageKey: "comunidad_free",
      href: "/publicar/comunidad/quick",
    }),
  },
  {
    id: "mascotas",
    group: "clasificados",
    labelEs: "Mascotas y Perdidos",
    labelEn: "Pets & Lost",
    mode: "open",
    staffHref: "/publicar/mascotas-y-perdidos/quick",
    customerHref: "/publicar/mascotas-y-perdidos",
    customerCheckpointHref: "/publicar/mascotas-y-perdidos",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({
      id: "mascotas",
      labelEs: "Mascotas",
      labelEn: "Pets",
      packageKey: "mascotas_free",
      href: "/publicar/mascotas-y-perdidos/quick",
    }),
  },
  {
    id: "servicios",
    group: "negocios",
    labelEs: "Servicios",
    labelEn: "Services",
    mode: "assisted",
    assistedCategory: "servicios",
    staffHref: QUICK_SALES_CATEGORY_MAP.servicios.intakePath,
    customerHref: "/clasificados/publicar/servicios/checkpoint",
    customerCheckpointHref: "/clasificados/publicar/servicios/checkpoint",
    hasQuickFull: true,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: pairProducts("servicios", QUICK_SALES_CATEGORY_MAP.servicios.intakePath),
  },
  {
    id: "restaurantes",
    group: "negocios",
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
    mode: "assisted",
    assistedCategory: "restaurantes",
    staffHref: QUICK_SALES_CATEGORY_MAP.restaurantes.intakePath,
    customerHref: "/publicar/restaurantes",
    customerCheckpointHref: "/publicar/restaurantes",
    hasQuickFull: true,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: pairProducts("restaurantes", QUICK_SALES_CATEGORY_MAP.restaurantes.intakePath),
  },
  {
    id: "comida-local",
    group: "negocios",
    labelEs: "Comida Local",
    labelEn: "Local Food",
    mode: "assisted",
    assistedCategory: "comida-local",
    staffHref: QUICK_SALES_CATEGORY_MAP["comida-local"].intakePath,
    customerHref: "/publicar/comida-local/checkpoint",
    customerCheckpointHref: "/publicar/comida-local/checkpoint",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: singleProduct({
      id: "comida-local",
      labelEs: "Comida Local",
      labelEn: "Local Food",
      packageKey: STAFF_CATEGORY_PRICED_PACKAGE_KEYS["comida-local"],
      href: QUICK_SALES_CATEGORY_MAP["comida-local"].intakePath,
    }),
  },
  {
    id: "autos",
    group: "negocios",
    labelEs: "Autos Dealer",
    labelEn: "Auto Dealer",
    mode: "assisted",
    assistedCategory: "autos",
    staffHref: QUICK_SALES_CATEGORY_MAP.autos.intakePath,
    customerHref: "/clasificados/publicar/autos",
    customerCheckpointHref: "/clasificados/publicar/autos",
    hasQuickFull: true,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: pairProducts("autos", QUICK_SALES_CATEGORY_MAP.autos.intakePath),
  },
  {
    id: "bienes-raices",
    group: "negocios",
    labelEs: "Bienes Raíces Negocio",
    labelEn: "Real Estate Business",
    mode: "assisted",
    assistedCategory: "bienes-raices",
    staffHref: QUICK_SALES_CATEGORY_MAP["bienes-raices"].intakePath,
    customerHref: "/clasificados/publicar/bienes-raices",
    customerCheckpointHref: "/clasificados/publicar/bienes-raices",
    hasQuickFull: true,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: true,
    products: pairProducts("bienes-raices", QUICK_SALES_CATEGORY_MAP["bienes-raices"].intakePath),
  },
  {
    id: "ofertas-locales",
    group: "ofertas",
    labelEs: "Ofertas Locales",
    labelEn: "Local Offers",
    mode: "open",
    staffHref: "/publicar/ofertas-locales",
    customerHref: "/publicar/ofertas-locales",
    customerCheckpointHref: "/publicar/ofertas-locales",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: [
      {
        id: "flyer",
        labelEs: "Volante interactivo",
        labelEn: "Interactive flyer",
        plan: "flyer",
        packageKey: "ofertas_locales_flyer_30d",
        staffHref: "/publicar/ofertas-locales?product=interactive_flyer",
        customerHref: "/publicar/ofertas-locales?product=interactive_flyer",
      },
      {
        id: "coupon",
        labelEs: "Cupón",
        labelEn: "Coupon",
        plan: "coupon",
        packageKey: "ofertas_locales_coupons_30d",
        staffHref: "/publicar/ofertas-locales?product=coupon_promotion",
        customerHref: "/publicar/ofertas-locales?product=coupon_promotion",
      },
    ],
  },
  {
    id: "viajes",
    group: "otros",
    labelEs: "Viajes",
    labelEn: "Travel",
    mode: "open",
    staffHref: "/publicar/viajes/checkpoint",
    customerHref: "/publicar/viajes/checkpoint",
    customerCheckpointHref: "/publicar/viajes/checkpoint",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: [
      {
        id: "negocio",
        labelEs: "Viajes negocio",
        labelEn: "Travel business",
        plan: "negocio",
        packageKey: "viajes_business_monthly",
        staffHref: "/publicar/viajes/negocios",
        customerHref: "/publicar/viajes/negocios",
      },
      {
        id: "privado",
        labelEs: "Viajes privado",
        labelEn: "Travel private",
        plan: "privado",
        staffHref: "/publicar/viajes/privado",
        customerHref: "/publicar/viajes/privado",
      },
    ],
  },
  {
    id: "iglesias",
    group: "otros",
    labelEs: "Iglesias",
    labelEn: "Churches",
    mode: "admin",
    staffHref: "/admin/workspace/iglesias",
    customerHref: "/iglesias/registrar",
    customerCheckpointHref: "/iglesias/registrar",
    hasQuickFull: false,
    publicCreationAllowed: true,
    staffOnly: false,
    customerQuickLink: false,
    products: singleProduct({
      id: "iglesias",
      labelEs: "Registro de iglesia",
      labelEn: "Church registration",
      href: "/admin/workspace/iglesias",
    }),
  },
  {
    id: "recursos",
    group: "otros",
    labelEs: "Recursos Comunitarios",
    labelEn: "Community Resources",
    mode: "admin",
    staffHref: "/admin/recursos/nuevo",
    customerHref: null,
    customerCheckpointHref: null,
    hasQuickFull: false,
    publicCreationAllowed: false,
    staffOnly: true,
    customerQuickLink: false,
    products: singleProduct({
      id: "recursos",
      labelEs: "Agregar recurso verificado",
      labelEn: "Add verified resource",
      href: "/admin/recursos/nuevo",
    }),
  },
];

export const STAFF_LAUNCHER_GROUP_LABEL: Record<StaffLauncherGroup, { es: string; en: string }> = {
  clasificados: { es: "Clasificados", en: "Classifieds" },
  negocios: { es: "Negocios locales", en: "Local businesses" },
  ofertas: { es: "Ofertas", en: "Offers" },
  otros: { es: "Otros", en: "Other" },
};

export function staffLauncherItem(id: string): StaffLauncherItem | null {
  return STAFF_MASTER_LAUNCHER_ITEMS.find((item) => item.id === id) ?? null;
}

export function staffLauncherItemsInGroup(group: StaffLauncherGroup): StaffLauncherItem[] {
  return STAFF_MASTER_LAUNCHER_ITEMS.filter((item) => item.group === group);
}

export function staffCustomerQuickLinkItems(): StaffLauncherItem[] {
  return STAFF_MASTER_LAUNCHER_ITEMS.filter((item) => item.customerQuickLink);
}

export function isStaffLauncherId(value: unknown): value is string {
  return typeof value === "string" && STAFF_MASTER_LAUNCHER_ITEMS.some((item) => item.id === value);
}

export function assistedCategoryForLauncher(id: string): QuickSalesCategory | null {
  const item = staffLauncherItem(id);
  if (item?.assistedCategory && isQuickSalesCategory(item.assistedCategory)) return item.assistedCategory;
  return null;
}

export function staffLauncherHasQuickFull(id: string): boolean {
  return Boolean(staffLauncherItem(id)?.hasQuickFull && isStaffBusinessPairCategory(id));
}

export function staffLauncherProductPriceLabel(packageKey: string | undefined): string {
  return packageKey ? priceFor(packageKey) : "";
}

export const STAFF_CUSTOMER_QUICK_LINK_IDS = EIGHT_QUICK_CUSTOMER;
