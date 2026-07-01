import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantesSelectorClient } from "./RestaurantesSelectorClient";

type Lang = "es" | "en";

const REST_PUBLICAR_ESTABLECIDO = "/publicar/restaurantes";
const COMIDA_LOCAL_PUBLICAR = "/publicar/comida-local";

const COPY = {
  es: {
    title: "Publicar en Restaurantes",
    body: "Elige el tipo de negocio de comida que quieres publicar en Leonix.",
    card1Kicker: "Establecimiento",
    card1Title: "Restaurante establecido",
    card1Price: "$399/mes",
    card1Body:
      "Perfil completo para restaurantes, cafés, panaderías, taquerías, food trucks establecidos y negocios de comida con presencia continua.",
    card1Cta: "Publicar restaurante",
    card1More: "Ver más",
    card1MoreTitle: "Qué incluye Restaurante establecido — $399/mes",
    card1MoreDetails:
      "Este plan crea una ficha premium para que clientes encuentren tu restaurante, revisen tus platos, vean horarios, contacten, abran el mapa, visiten tus redes y entiendan por qué deben visitarte.",
    card1MoreBullets: [
      "Perfil visual con foto principal, logo y galería",
      "Especialidades de la casa con precios/descripción",
      "Videos/enlaces de video",
      "Contacto: llamar, mensaje, WhatsApp, correo, sitio web o formulario",
      "Ubicación/mapa si hay dirección pública",
      "Horarios en formato AM/PM",
      "Servicios: comer en local, para llevar, delivery, catering, eventos, reservas, etc.",
      "Redes sociales con iconos",
      "Sección de cupones opcional por +$99/mes",
      "Preparado para móvil/PWA",
    ],
    card2Kicker: "Comida Local",
    card2Title: "Puesto, pop-up o vendedor móvil",
    card2Price: "$199/mes",
    card2Body: "Para puestos, pop-ups, comida local, vendedores móviles, mercados, eventos y fines de semana.",
    card2Cta: "Publicar puesto móvil",
    card2More: "Ver más",
    card2MoreTitle: "Qué incluye Puesto / Pop-up / Vendedor móvil — $199/mes",
    card2MoreDetails:
      "Este plan ayuda a vendedores de comida móviles o temporales a mostrar dónde estarán, qué venden, cómo contactarlos y cómo la comunidad puede encontrarlos.",
    card2MoreBullets: [
      "Perfil compacto y profesional",
      "Fotos o flyer",
      "Zona de venta, ciudad o ubicación pública cuando aplique",
      "Horarios o días de presencia",
      "Contacto por llamada, texto, WhatsApp o redes",
      "Enlaces a menú, pedidos o redes",
      "Preparado para móvil/PWA",
    ],
  },
  en: {
    title: "Publish in Restaurants",
    body: "Choose the type of food business you want to publish on Leonix.",
    card1Kicker: "Establishment",
    card1Title: "Established restaurant",
    card1Price: "$399/mes",
    card1Body:
      "Full profile for restaurants, cafés, bakeries, taquerías, established food trucks, and businesses with continuous presence.",
    card1Cta: "Publish restaurant",
    card1More: "See more",
    card1MoreTitle: "What's included with Established restaurant — $399/mes",
    card1MoreDetails:
      "This plan creates a premium profile so customers can find your restaurant, review your dishes, see hours, contact, open the map, visit your social media, and understand why they should visit.",
    card1MoreBullets: [
      "Visual profile with hero photo, logo, and gallery",
      "House specialties with prices/description",
      "Videos/video links",
      "Contact: call, message, WhatsApp, email, website, or form",
      "Location/map if public address available",
      "Hours in AM/PM format",
      "Services: dine-in, takeout, delivery, catering, events, reservations, etc.",
      "Social media with icons",
      "Optional coupons section for +$99/mes",
      "Mobile/PWA ready",
    ],
    card2Kicker: "Local Food",
    card2Title: "Stand, pop-up, or mobile vendor",
    card2Price: "$199/mes",
    card2Body: "For stands, pop-ups, local food, mobile vendors, markets, events, and weekends.",
    card2Cta: "Publish mobile stand",
    card2More: "See more",
    card2MoreTitle: "What's included with Stand / Pop-up / Mobile vendor — $199/mes",
    card2MoreDetails:
      "This plan helps mobile or temporary food vendors show where they'll be, what they sell, how to contact them, and how the community can find them.",
    card2MoreBullets: [
      "Compact, professional profile",
      "Photos or flyer",
      "Sales zone, city, or public location when applicable",
      "Hours or days of presence",
      "Contact by call, text, WhatsApp, or social media",
      "Links to menu, orders, or social media",
      "Mobile/PWA ready",
    ],
  },
} as const;

export const metadata: Metadata = {
  title: "Publicar Restaurantes | Leonix Clasificados",
  description: "Elige entre restaurante establecido o Comida Local.",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function RestaurantesPublicarSelectorPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const t = COPY[lang];

  const withLang = (path: string) => {
    const joiner = path.includes("?") ? "&" : "?";
    return `${path}${joiner}lang=${lang}`;
  };

  return (
    <RestaurantesSelectorClient
      t={t}
      lang={lang}
      withLang={withLang}
      restPublicarEstablecido={REST_PUBLICAR_ESTABLECIDO}
      comidaLocalPublicar={COMIDA_LOCAL_PUBLICAR}
    />
  );
}
