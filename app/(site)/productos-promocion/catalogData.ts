export type CategoryId = "business-cards" | "marketing" | "promo" | "signs";

export type Product = {
  slug: string;
  es: { title: string; subtitle: string };
  en: { title: string; subtitle: string };
  imageStatus: "existing" | "placeholder" | "needed";
  imageNote: string;
};

export type CatalogCategory = {
  id: CategoryId;
  es: { label: string; description: string };
  en: { label: string; description: string };
  products: Product[];
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "business-cards",
    es: { label: "Tarjetas de presentación", description: "Impresión de alta calidad para representar tu marca." },
    en: { label: "Business Cards", description: "High-quality print to represent your brand." },
    products: [
      {
        slug: "standard-business-cards",
        es: { title: "Tarjetas estándar", subtitle: "La opción clásica y profesional a precio accesible." },
        en: { title: "Standard Business Cards", subtitle: "The classic professional option at an accessible price." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: stack of standard business cards on cream background, portrait orientation",
      },
      {
        slug: "premium-business-cards",
        es: { title: "Tarjetas premium", subtitle: "Papel grueso, colores vibrantes, acabado superior." },
        en: { title: "Premium Business Cards", subtitle: "Thick stock, vibrant colors, superior finish." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: premium thick-stock business card closeup showing texture detail",
      },
      {
        slug: "spot-uv-business-cards",
        es: { title: "Tarjetas con realce Spot UV", subtitle: "Acabado brillante selectivo que hace resaltar tu diseño." },
        en: { title: "Raised Spot UV Business Cards", subtitle: "Selective gloss finish that makes your design stand out." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: business card with glossy UV raised detail on dark warm background",
      },
      {
        slug: "painted-edge-business-cards",
        es: { title: "Tarjetas con canto de color", subtitle: "Un detalle que te diferencia: colores en el borde." },
        en: { title: "Painted Edge Business Cards", subtitle: "A detail that sets you apart: color on the edge." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: business card stack fanned to show gold/amber painted edges",
      },
      {
        slug: "fold-over-business-cards",
        es: { title: "Tarjetas dobladas", subtitle: "Más espacio para información, mismo formato compacto." },
        en: { title: "Fold-over Business Cards", subtitle: "More space for information, same compact format." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: folded business card shown open and closed side by side",
      },
    ],
  },
  {
    id: "marketing",
    es: { label: "Productos de marketing", description: "Materiales impresos para promover tu negocio." },
    en: { label: "Marketing Products", description: "Printed materials to promote your business." },
    products: [
      {
        slug: "flyers",
        es: { title: "Volantes", subtitle: "Diseños llamativos que generan impacto inmediato." },
        en: { title: "Flyers", subtitle: "Eye-catching designs that generate immediate impact." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: colorful promotional flyers fanned out on cream surface",
      },
      {
        slug: "brochures",
        es: { title: "Brochures", subtitle: "Trípticos y dípticos para presentar tu empresa completa." },
        en: { title: "Brochures", subtitle: "Tri-folds and bi-folds to present your full company story." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: tri-fold brochure open on desk, warm lighting",
      },
      {
        slug: "postcards",
        es: { title: "Postales", subtitle: "Perfectas para correo directo y promociones especiales." },
        en: { title: "Postcards", subtitle: "Perfect for direct mail and special promotions." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: postcard front and back displayed side by side",
      },
      {
        slug: "menus",
        es: { title: "Menús", subtitle: "Impresos de calidad para restaurantes y eventos." },
        en: { title: "Menus", subtitle: "Quality prints for restaurants and events." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: restaurant menu printed with warm elegant design, standing upright",
      },
      {
        slug: "door-hangers",
        es: { title: "Colgantes para puerta", subtitle: "Marketing directo en cada puerta de tu zona objetivo." },
        en: { title: "Door Hangers", subtitle: "Direct marketing at every door in your target area." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: door hanger hanging on a door handle",
      },
      {
        slug: "greeting-cards",
        es: { title: "Tarjetas de saludo", subtitle: "Conexión personal con clientes y colaboradores." },
        en: { title: "Greeting Cards", subtitle: "Personal connection with clients and collaborators." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: greeting card with matching envelope on cream surface",
      },
      {
        slug: "presentation-folders",
        es: { title: "Folders de presentación", subtitle: "Proyecta profesionalismo en cada reunión." },
        en: { title: "Presentation Folders", subtitle: "Project professionalism in every meeting." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: presentation folder open with branded documents inside",
      },
    ],
  },
  {
    id: "promo",
    es: { label: "Productos promocionales", description: "Artículos con tu marca que los clientes conservan." },
    en: { label: "Promo Products", description: "Branded items your clients will keep and remember." },
    products: [
      {
        slug: "tote-bags",
        es: { title: "Bolsas tote", subtitle: "Tu marca visible en cada salida." },
        en: { title: "Tote Bags", subtitle: "Your brand visible on every outing." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: natural canvas tote bag with Leonix-style print, flat lay",
      },
      {
        slug: "t-shirts",
        es: { title: "Camisetas", subtitle: "Uniformes y regalos que llevan tu marca al mundo." },
        en: { title: "T-Shirts", subtitle: "Uniforms and gifts that take your brand to the world." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: folded printed t-shirt on cream background, front print visible",
      },
      {
        slug: "mugs",
        es: { title: "Tazas", subtitle: "Presencia diaria en la rutina de tus clientes." },
        en: { title: "Mugs", subtitle: "Daily presence in your clients' routine." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: white mug with branded print on warm wooden surface, steam visible",
      },
      {
        slug: "buttons",
        es: { title: "Botones", subtitle: "Económicos, divertidos y muy visibles en eventos." },
        en: { title: "Buttons", subtitle: "Affordable, fun, and highly visible at events." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: group of colorful branded pinback buttons on white surface",
      },
      {
        slug: "pens",
        es: { title: "Plumas", subtitle: "El artículo promocional más utilizado en el mundo." },
        en: { title: "Pens", subtitle: "The world's most widely used promotional item." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: branded pens in a fan arrangement on desk surface",
      },
      {
        slug: "drinkware",
        es: { title: "Vasos y termos", subtitle: "Marca de alto impacto en productos de uso diario." },
        en: { title: "Drinkware", subtitle: "High-impact branding on everyday products." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: branded tumbler and insulated water bottle side by side",
      },
      {
        slug: "apparel",
        es: { title: "Ropa promocional", subtitle: "Uniformes, chaquetas y accesorios para tu equipo." },
        en: { title: "Apparel", subtitle: "Uniforms, jackets and accessories for your team." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: branded polo shirt and embroidered jacket on white background",
      },
    ],
  },
  {
    id: "signs",
    es: { label: "Letreros y banners", description: "Visibilidad de gran formato donde más importa." },
    en: { label: "Signs & Banners", description: "Large-format visibility where it matters most." },
    products: [
      {
        slug: "vinyl-banners",
        es: { title: "Banners de vinil", subtitle: "Visibilidad de gran formato a precios competitivos." },
        en: { title: "Vinyl Banners", subtitle: "Large-format visibility at competitive prices." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: outdoor vinyl banner hanging at event entrance in daylight",
      },
      {
        slug: "yard-signs",
        es: { title: "Letreros de jardín", subtitle: "Presencia local para casas, eventos y negocios." },
        en: { title: "Yard Signs", subtitle: "Local presence for homes, events, and businesses." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: corrugated yard sign on green lawn, H-stake mounted",
      },
      {
        slug: "retractable-banners",
        es: { title: "Banners retráctiles", subtitle: "Fáciles de montar y transportar para cualquier evento." },
        en: { title: "Retractable Banners", subtitle: "Easy to set up and transport for any event." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: retractable banner stand at indoor trade show",
      },
      {
        slug: "tabletop-displays",
        es: { title: "Displays de mesa", subtitle: "Perfectos para ferias, recepciones y tiendas." },
        en: { title: "Tabletop Displays", subtitle: "Perfect for fairs, receptions, and storefronts." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: branded tabletop display sign on conference table",
      },
      {
        slug: "event-tents",
        es: { title: "Carpas para eventos", subtitle: "Tu marca imponente en ferias y eventos al aire libre." },
        en: { title: "Event Tents", subtitle: "Your brand front and center at outdoor fairs and events." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: 10x10 branded canopy tent at outdoor market, sunny day",
      },
      {
        slug: "window-clings",
        es: { title: "Vinilos para ventana", subtitle: "Decoración y mensajes en el escaparate de tu negocio." },
        en: { title: "Window Clings", subtitle: "Decoration and messaging on your business storefront." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: window cling applied to glass storefront, interior view",
      },
      {
        slug: "sidewalk-signs",
        es: { title: "Letreros para banqueta", subtitle: "Capta clientes que pasan frente a tu negocio." },
        en: { title: "Sidewalk Signs", subtitle: "Capture customers walking past your business." },
        imageStatus: "placeholder",
        imageNote: "Leonix branded: A-frame sidewalk sign outside a café on a sunny street",
      },
    ],
  },
];
