export type CategoryId = "business-cards" | "marketing" | "signs" | "promo" | "essentials";

export type VisualType = "placeholder-visual" | "needs-v1-svg" | "needs-photo-upgrade-later";

export type Product = {
  slug: string;
  subcategory?: string;
  es: { title: string; subtitle: string };
  en: { title: string; subtitle: string };
  visualType: VisualType;
};

export type CatalogCategory = {
  id: CategoryId;
  es: { label: string; description: string };
  en: { label: string; description: string };
  products: Product[];
};

function p(
  slug: string,
  esTitle: string,
  esSub: string,
  enTitle: string,
  enSub: string,
  visualType: VisualType = "placeholder-visual",
  subcategory?: string,
): Product {
  return { slug, es: { title: esTitle, subtitle: esSub }, en: { title: enTitle, subtitle: enSub }, visualType, subcategory };
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "business-cards",
    es: { label: "Tarjetas de presentación", description: "Impresión de alta calidad para representar tu marca." },
    en: { label: "Business Cards", description: "High-quality print to represent your brand." },
    products: [
      p("standard-business-cards", "Tarjetas estándar", "La opción clásica y profesional a precio accesible.", "Standard Business Cards", "The classic professional option at an accessible price."),
      p("premium-business-cards", "Tarjetas premium", "Papel grueso, colores vibrantes, acabado superior.", "Premium Business Cards", "Thick stock, vibrant colors, superior finish."),
      p("matte-business-cards", "Tarjetas mate", "Acabado suave y elegante, sin reflejos.", "Matte Business Cards", "Soft, elegant finish with no glare."),
      p("gloss-business-cards", "Tarjetas brillantes", "Colores intensos con acabado brillante de alto impacto.", "Gloss Business Cards", "Vivid colors with a high-impact shiny finish."),
      p("suede-business-cards", "Tarjetas suede", "Textura aterciopelada de alto impacto táctil.", "Suede Business Cards", "Velvety texture with high tactile impact."),
      p("silk-business-cards", "Tarjetas silk", "Papel silk de doble cara, suave y duradero.", "Silk Business Cards", "Double-sided silk paper, smooth and durable."),
      p("spot-uv-business-cards", "Tarjetas con Spot UV", "Acabado brillante selectivo que resalta tu diseño.", "Raised Spot UV Business Cards", "Selective gloss finish that highlights your design."),
      p("foil-business-cards", "Tarjetas con foil", "Detalles dorados o plateados que dejan huella.", "Foil Business Cards", "Gold or silver details that leave a lasting impression."),
      p("painted-edge-business-cards", "Tarjetas canto de color", "Colores en el borde que te diferencian.", "Painted Edge Business Cards", "Color on the edge that sets you apart."),
      p("fold-over-business-cards", "Tarjetas dobladas", "Más espacio para información en formato compacto.", "Fold-over Business Cards", "More info space in the same compact format."),
      p("plastic-business-cards", "Tarjetas plásticas", "Resistentes al agua, duraderas y de alto impacto.", "Plastic Business Cards", "Waterproof, durable, and high-impact."),
      p("square-business-cards", "Tarjetas cuadradas", "Formato único que destaca en cualquier cartera.", "Square Business Cards", "Unique format that stands out in any wallet."),
      p("rounded-corner-business-cards", "Tarjetas esquinas redondeadas", "Acabado suave y moderno con bordes curvos.", "Rounded Corner Business Cards", "Smooth modern finish with curved edges."),
      p("loyalty-cards", "Tarjetas de lealtad", "Fideliza clientes con puntos, sellos o descuentos.", "Loyalty Cards", "Retain customers with points, stamps, or discounts."),
      p("appointment-cards", "Tarjetas de citas", "Recuérdales cuándo regresar con una tarjeta clara.", "Appointment Cards", "Remind clients when to return with a clear card."),
    ],
  },
  {
    id: "marketing",
    es: { label: "Impresos de marketing", description: "Materiales impresos para promocionar tu negocio eficazmente." },
    en: { label: "Marketing Print", description: "Printed materials to effectively promote your business." },
    products: [
      p("flyers", "Volantes", "Diseños llamativos para impacto inmediato y masivo.", "Flyers", "Eye-catching designs for immediate and wide impact."),
      p("brochures", "Brochures", "Presenta tu empresa en un formato completo y profesional.", "Brochures", "Present your company in a comprehensive, professional format."),
      p("tri-fold-brochures", "Trípticos", "Tres paneles con toda tu información organizada.", "Tri-fold Brochures", "Three panels with all your information organized."),
      p("postcards", "Postales", "Ideales para correo directo y promociones especiales.", "Postcards", "Ideal for direct mail and special promotions."),
      p("rack-cards", "Tarjetas promocionales verticales", "Formato vertical perfecto para stands y mostradores.", "Rack Cards", "Vertical format perfect for stands and countertops."),
      p("door-hangers", "Colgantes para puerta", "Marketing directo en cada puerta de tu zona objetivo.", "Door Hangers", "Direct marketing at every door in your target area."),
      p("menus", "Menús", "Impresión de calidad para restaurantes y eventos.", "Menus", "Quality printing for restaurants and events."),
      p("takeout-menus", "Menús para llevar", "Compactos y prácticos para pedidos a domicilio.", "Takeout Menus", "Compact and practical for delivery and takeout orders."),
      p("presentation-folders", "Folders de presentación", "Proyecta profesionalismo en cada reunión de negocios.", "Presentation Folders", "Project professionalism in every business meeting."),
      p("greeting-cards", "Tarjetas de saludo", "Conexión personal con clientes y colaboradores.", "Greeting Cards", "Personal connection with clients and collaborators."),
      p("invitations", "Invitaciones", "Para eventos, inauguraciones y celebraciones especiales.", "Invitations", "For events, grand openings, and special celebrations."),
      p("event-tickets", "Boletos para eventos", "Con numeración, perforación y seguridad básica.", "Event Tickets", "With numbering, perforation, and basic security features."),
      p("bookmarks", "Separadores", "Tu marca en un formato práctico y duradero.", "Bookmarks", "Your brand in a practical and lasting format."),
      p("catalogs", "Catálogos", "Muestra tu inventario completo de forma profesional.", "Catalogs", "Display your full inventory professionally."),
      p("booklets", "Folletos engrapados", "Hasta 48 páginas para presentaciones completas.", "Booklets", "Up to 48 pages for comprehensive presentations."),
      p("calendars", "Calendarios", "Tu marca visible todos los días del año.", "Calendars", "Your brand visible every day of the year."),
      p("stickers", "Stickers", "Versátiles, económicos y altamente visibles.", "Stickers", "Versatile, affordable, and highly visible."),
      p("labels", "Etiquetas", "Para productos, envases, empaques y regalos.", "Labels", "For products, containers, packaging, and gifts."),
      p("ncr-forms", "Formas NCR", "Recibos con copia autocopiativa sin papel carbón.", "NCR Forms", "Receipts with self-copy without carbon paper."),
      p("envelopes", "Sobres", "Sobres membretados que proyectan profesionalismo.", "Envelopes", "Letterhead envelopes that project professionalism."),
      p("letterhead", "Hojas membretadas", "Papel con tu marca para comunicaciones oficiales.", "Letterhead", "Branded paper for official business communications."),
      p("notepads", "Libretas", "Con tu logo en cada página, útiles y memorables.", "Notepads", "Your logo on every page — useful and memorable."),
      p("carbonless-forms", "Formas autocopiativas", "Pedidos, contratos y recibos en copia múltiple.", "Carbonless Forms", "Orders, contracts, and receipts in multiple copies."),
      p("sell-sheets", "Hojas de venta", "Un solo pliego con todo para convencer al cliente.", "Sell Sheets", "A single sheet with everything to close the deal."),
      p("table-tents", "Displays tipo carpa", "Perfectos para mesas en restaurantes y ferias.", "Table Tents", "Perfect for restaurant tables and fair booths."),
      p("printed-magnets", "Imanes impresos", "Tu teléfono en el refrigerador de cada cliente.", "Printed Magnets", "Your phone number on every customer's fridge."),
      p("coupons", "Cupones", "Genera retorno de clientes con descuentos impresos.", "Coupons", "Drive customer return with printed discount offers."),
    ],
  },
  {
    id: "signs",
    es: { label: "Letreros y banners", description: "Visibilidad de gran formato donde más importa." },
    en: { label: "Signs & Banners", description: "Large-format visibility where it matters most." },
    products: [
      p("vinyl-banners", "Banners de vinil", "Gran formato a precios competitivos para exteriores.", "Vinyl Banners", "Large format at competitive prices for outdoor use."),
      p("mesh-banners", "Banners mesh", "Para exteriores con viento — el aire pasa sin daño.", "Mesh Banners", "For windy outdoor spots — air passes through safely."),
      p("fabric-banners", "Banners de tela", "Textura premium para interiores y eventos de lujo.", "Fabric Banners", "Premium texture for indoor and luxury events."),
      p("step-and-repeat-banners", "Backdrops paso y repite", "Fondos con logos repetidos para fotos y prensa.", "Step and Repeat Banners", "Logo-repeated backdrops for photos and press."),
      p("retractable-banners", "Banners retráctiles", "Fáciles de montar y transportar para cualquier evento.", "Retractable Banners", "Easy to set up and carry to any event."),
      p("x-stand-banners", "Banners con soporte X", "Económicos y ligeros para uso en interiores.", "X-Stand Banners", "Affordable and light for indoor use."),
      p("yard-signs", "Letreros de jardín", "Presencia local en casas, eventos y negocios.", "Yard Signs", "Local presence at homes, events, and businesses."),
      p("real-estate-signs", "Letreros de bienes raíces", "Señalización estándar para propiedades en venta.", "Real Estate Signs", "Standard signage for properties on the market."),
      p("sidewalk-signs", "Letreros para banqueta", "Capta clientes que pasan frente a tu negocio.", "Sidewalk Signs", "Capture customers walking past your storefront."),
      p("a-frame-signs", "Letreros A-frame", "Doble cara para máxima visibilidad en dos direcciones.", "A-Frame Signs", "Double-sided for maximum visibility both ways."),
      p("window-clings", "Vinilos para ventana", "Decoración y mensajes en el escaparate de tu negocio.", "Window Clings", "Decoration and messaging on your business storefront."),
      p("window-perforated-vinyl", "Vinil perforado ventana", "Se ve desde afuera; desde adentro es transparente.", "Perforated Window Vinyl", "Visible from outside; transparent from inside."),
      p("wall-decals", "Vinilos para pared", "Transforma el ambiente de tu negocio con diseño.", "Wall Decals", "Transform your business space with custom design."),
      p("floor-graphics", "Gráficos para piso", "Señalización en el suelo para eventos y tiendas.", "Floor Graphics", "Floor-level signage for events and retail stores."),
      p("car-magnets", "Imanes para carro", "Publicidad móvil que puedes quitar y poner.", "Car Magnets", "Mobile advertising you can remove and reapply."),
      p("vehicle-magnets", "Imanes vehiculares", "Para camionetas, camiones y flotas de trabajo.", "Vehicle Magnets", "For vans, trucks, and work vehicle fleets."),
      p("tabletop-displays", "Displays de mesa", "Perfectos para ferias, recepciones y tiendas.", "Tabletop Displays", "Perfect for fairs, receptions, and retail stores."),
      p("event-tents", "Carpas para eventos", "Tu marca imponente en ferias al aire libre.", "Event Tents", "Your brand front and center at outdoor fairs."),
      p("flags", "Banderas", "Ondea tu marca en exteriores con gran impacto.", "Flags", "Wave your brand outdoors with great impact."),
      p("feather-flags", "Banderas tipo pluma", "Llaman la atención desde lejos en cualquier evento.", "Feather Flags", "Catch attention from afar at any event."),
      p("posters", "Pósters", "Gran formato para exhibición interior y exterior.", "Posters", "Large format for indoor and outdoor display."),
      p("foam-board-signs", "Letreros foam board", "Ligeros y rígidos para interiores y exhibiciones.", "Foam Board Signs", "Light and rigid for indoor and exhibition use."),
      p("coroplast-signs", "Letreros coroplast", "Corrugados y resistentes para exteriores.", "Coroplast Signs", "Corrugated and durable for outdoor use."),
      p("acrylic-signs", "Letreros acrílicos", "Transparentes o de color para un look premium.", "Acrylic Signs", "Clear or colored for a premium and modern look."),
      p("aluminum-signs", "Letreros de aluminio", "Resistentes a la intemperie, duraderos y elegantes.", "Aluminum Signs", "Weather-resistant, durable, and elegant."),
      p("parking-signs", "Letreros de estacionamiento", "Señalización clara para tu zona de estacionamiento.", "Parking Signs", "Clear signage for your parking area."),
      p("hanging-signs", "Letreros colgantes", "Para colgar en tiendas, pasillos y ferias.", "Hanging Signs", "For stores, hallways, and fair display booths."),
    ],
  },
  {
    id: "promo",
    es: { label: "Productos promocionales", description: "Artículos con tu marca que los clientes conservan." },
    en: { label: "Promo Products", description: "Branded items your clients keep and remember." },
    products: [
      p("t-shirts", "Camisetas", "Uniformes y regalos que llevan tu marca al mundo.", "T-Shirts", "Uniforms and gifts that take your brand anywhere."),
      p("polo-shirts", "Polos", "Imagen profesional para tu equipo de trabajo.", "Polo Shirts", "Professional image for your work team."),
      p("hoodies", "Sudaderas", "Cómodas y visibles — perfectas para temporadas frías.", "Hoodies", "Comfortable and visible — perfect for cool seasons."),
      p("hats", "Gorras", "Tu logo sobre la cabeza de cada cliente.", "Hats", "Your logo above every customer's head."),
      p("tote-bags", "Bolsas tote", "Tu marca visible en cada salida al mercado.", "Tote Bags", "Your brand visible on every market outing."),
      p("drawstring-bags", "Bolsas con cordón", "Económicas y prácticas para eventos y escuelas.", "Drawstring Bags", "Affordable and practical for events and schools."),
      p("mugs", "Tazas", "Presencia diaria en la rutina de tus clientes.", "Mugs", "Daily presence in your clients' morning routine."),
      p("tumblers", "Vasos térmicos", "Marca visible en cada café y reunión de trabajo.", "Tumblers", "Brand visible at every coffee and work meeting."),
      p("water-bottles", "Botellas de agua", "Artículo premium muy apreciado en eventos.", "Water Bottles", "Premium giveaway highly appreciated at events."),
      p("pens", "Plumas", "El artículo promocional más usado en el mundo.", "Pens", "The world's most widely used promotional item."),
      p("pencils", "Lápices", "Para escuelas, ferias y paquetes de bienvenida.", "Pencils", "For schools, fairs, and welcome kit bundles."),
      p("buttons", "Botones", "Económicos, divertidos y muy visibles en eventos.", "Buttons", "Affordable, fun, and highly visible at events."),
      p("promo-magnets", "Imanes promocionales", "Tu teléfono en el refrigerador de tus clientes.", "Promo Magnets", "Your number on every customer's refrigerator."),
      p("keychains", "Llaveros", "Prácticos y siempre presentes — en el bolsillo.", "Keychains", "Practical and always present — in their pocket."),
      p("lanyards", "Lanyards", "Para eventos, convenciones y credenciales de equipo.", "Lanyards", "For events, conventions, and team credentials."),
      p("promo-stickers", "Stickers promocionales", "Para cuadernos, laptops, empaques y más.", "Promo Stickers", "For notebooks, laptops, packaging, and more."),
      p("mouse-pads", "Mouse pads", "Tu marca sobre el escritorio de cada cliente.", "Mouse Pads", "Your brand on every client's work desk."),
      p("notebooks", "Cuadernos", "Con tu marca en cada página, útiles y recordados.", "Notebooks", "Your brand on every page — useful and memorable."),
      p("umbrellas", "Sombrillas", "Grande, visible y de alta utilidad en cualquier clima.", "Umbrellas", "Large, visible, and useful in any weather."),
      p("aprons", "Delantales", "Para restaurantes, cocinas y ferias de comida.", "Aprons", "For restaurants, kitchens, and food events."),
      p("reusable-cups", "Vasos reutilizables", "Ecofriendly y con tu logo — regalo muy apreciado.", "Reusable Cups", "Eco-friendly with your logo — a gift people love."),
      p("coasters", "Posavasos", "Tus datos de contacto siempre frente al cliente.", "Coasters", "Your contact info always in front of the client."),
      p("phone-accessories", "Accesorios para teléfono", "Sockets, fundas y soportes con tu marca.", "Phone Accessories", "Sockets, cases, and holders with your brand."),
      p("event-giveaways", "Regalos para eventos", "Kits de artículos útiles para ferias y lanzamientos.", "Event Giveaways", "Useful item kits for fairs and product launches."),
      p("name-badges", "Gafetes", "Para eventos, conferencias y uso diario del equipo.", "Name Badges", "For events, conferences, and daily team use."),
      p("wristbands", "Pulseras", "Control de acceso o identidad para cualquier evento.", "Wristbands", "Access control or identity for any event."),
      p("tote-kits", "Kits de bolsas promocionales", "Conjunto completo de artículos para sorprender.", "Tote Kits", "A complete set of branded items to impress clients."),
    ],
  },
  {
    id: "essentials",
    es: { label: "Esenciales para negocios", description: "Kits y paquetes para arrancar o hacer crecer tu negocio." },
    en: { label: "Business Essentials", description: "Kits and bundles to start or grow your business." },
    products: [
      p("branded-starter-kit", "Kit inicial de marca", "Tarjetas, volante y letrero para comenzar bien.", "Branded Starter Kit", "Cards, flyer, and sign to start your brand right."),
      p("grand-opening-kit", "Kit de gran apertura", "Todo para un lanzamiento visible e impactante.", "Grand Opening Kit", "Everything for a visible and impactful opening."),
      p("restaurant-starter-kit", "Kit para restaurante", "Menús, postales, letrero y tarjetas para tu local.", "Restaurant Starter Kit", "Menus, postcards, sign, and cards for your spot."),
      p("event-booth-kit", "Kit para eventos", "Carpa, banner, tablero y materiales para feria.", "Event Booth Kit", "Tent, banner, board, and fair display materials."),
      p("real-estate-marketing-kit", "Kit de marketing inmobiliario", "Letreros, postales, folders y tarjetas para agentes.", "Real Estate Marketing Kit", "Signs, postcards, folders, and cards for agents."),
      p("church-outreach-kit", "Kit para iglesias", "Flyers, invitaciones y banners para alcance comunitario.", "Church Outreach Kit", "Flyers, invitations, and banners for outreach."),
      p("contractor-marketing-kit", "Kit para contratistas", "Yard signs, tarjetas y folletos para tu área.", "Contractor Marketing Kit", "Yard signs, cards, and brochures for your area."),
      p("salon-beauty-kit", "Kit para salón y belleza", "Tarjetas de citas, loyalty cards y postales.", "Salon & Beauty Kit", "Appointment cards, loyalty cards, and postcards."),
      p("food-truck-kit", "Kit para food truck", "Menú, banderas, camisetas y materiales para el camión.", "Food Truck Kit", "Menu, flags, shirts, and materials for your truck."),
      p("loyalty-program-materials", "Materiales programa de lealtad", "Tarjetas perforadas, sellos y kits de fidelización.", "Loyalty Program Materials", "Punch cards, stamps, and complete loyalty kits."),
      p("coupon-cards", "Tarjetas de cupón", "Descuentos físicos que generan retorno de clientes.", "Coupon Cards", "Physical discounts that drive customer return."),
      p("gift-certificates", "Certificados de regalo", "Vende experiencias y servicios como regalos.", "Gift Certificates", "Sell experiences and services as gifts."),
      p("thank-you-cards", "Tarjetas de agradecimiento", "Cuida a tus clientes con un gesto de valor real.", "Thank You Cards", "Retain clients with a meaningful personal gesture."),
      p("review-request-cards", "Tarjetas para pedir reseñas", "Aumenta tus reseñas en Google con una tarjeta QR.", "Review Request Cards", "Boost your Google reviews with a QR card."),
      p("qr-code-table-cards", "Tarjetas de mesa con QR", "Menú digital, formularios y links en cada mesa.", "QR Code Table Cards", "Digital menu, forms, or links at every table."),
      p("new-business-launch-bundle", "Paquete lanzamiento de negocio", "Kit completo para el primer mes de tu negocio.", "New Business Launch Bundle", "Complete kit for your business's first month."),
      p("hiring-recruiting-kit", "Kit para contratación", "Flyers, banners y tarjetas para atraer talento.", "Hiring & Recruiting Kit", "Flyers, banners, and cards to attract talent."),
    ],
  },
];
