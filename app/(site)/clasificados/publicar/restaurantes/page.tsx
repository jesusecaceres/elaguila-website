import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantesSelectorClient } from "./RestaurantesSelectorClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

const COPY = {
  es: {
    title: "Publicar en Restaurantes",
    body: "Elige el tipo de negocio de comida que quieres publicar en Leonix.",
    card1Kicker: "Establecimiento",
    card1Title: "Restaurante establecido",
    card1Price: "$399/mes",
    card1Body:
      "Para restaurantes, cafés, panaderías, food trucks establecidos y negocios con perfil completo. Incluye ficha premium con galería, horarios, ubicación, contacto, redes, platillos destacados y presencia en Leonix.",
    card1Cta: "Publicar restaurante",
    card1More: "Ver más",
    card1MoreTitle: "Qué incluye Restaurante establecido — $399/mes",
    card1MoreDetails:
      "Este plan crea una ficha premium para que clientes encuentren tu restaurante, revisen tus platos, vean horarios, contacten, abran el mapa, visiten tus redes y entiendan por qué deben visitarte.",
    card1MoreBullets: [
      "Qué incluye: Perfil visual con foto principal, logo y galería",
      "Para quién es: Restaurantes, cafés, panaderías, food trucks establecidos y negocios con presencia continua",
      "Qué aparece en la ficha: Especialidades de la casa, videos, contacto, ubicación/mapa, horarios AM/PM, servicios, redes sociales",
      "Qué necesita completar: Información del negocio, fotos, horarios, contacto y ubicación",
      "Precio mensual: $399/mes",
      "Nota: La publicación se activa después de revisión final.",
    ],
    card2Kicker: "Comida Local",
    card2Title: "Puesto, pop-up o vendedor móvil",
    card2Price: "$199/mes",
    card2Body: "Para puestos, pop-ups, comida casera, vendedores móviles y fines de semana. Ideal para negocios que venden por ubicación temporal, eventos o servicio local.",
    card2Cta: "Publicar comida local",
    card2More: "Ver más",
    card2MoreTitle: "Qué incluye Puesto / Pop-up / Vendedor móvil — $199/mes",
    card2MoreDetails:
      "Este plan ayuda a vendedores de comida móviles o temporales a mostrar dónde estarán, qué venden, cómo contactarlos y cómo la comunidad puede encontrarlos.",
    card2MoreBullets: [
      "Qué incluye: Perfil compacto y profesional con fotos o flyer",
      "Para quién es: Puestos, pop-ups, comida casera, vendedores móviles, mercados, eventos y fines de semana",
      "Qué aparece en la ficha: Zona de venta, ciudad, horarios/días de presencia, contacto, enlaces a menú/pedidos",
      "Qué necesita completar: Información del negocio, fotos, zona de venta, horarios y contacto",
      "Precio mensual: $199/mes",
      "Nota: La publicación se activa después de revisión final.",
    ],
  },
  en: {
    title: "Publish in Restaurants",
    body: "Choose the type of food business you want to publish on Leonix.",
    card1Kicker: "Establishment",
    card1Title: "Established restaurant",
    card1Price: "$399/mes",
    card1Body:
      "For restaurants, cafés, bakeries, established food trucks, and businesses with complete profile. Includes premium profile with gallery, hours, location, contact, social media, featured dishes and presence on Leonix.",
    card1Cta: "Publish restaurant",
    card1More: "See more",
    card1MoreTitle: "What's included with Established restaurant — $399/mes",
    card1MoreDetails:
      "This plan creates a premium profile so customers can find your restaurant, review your dishes, see hours, contact, open the map, visit your social media, and understand why they should visit.",
    card1MoreBullets: [
      "What's included: Visual profile with hero photo, logo, and gallery",
      "Who it's for: Restaurants, cafés, bakeries, established food trucks, and businesses with continuous presence",
      "What appears on profile: House specialties, videos, contact, location/map, AM/PM hours, services, social media",
      "What you need to complete: Business info, photos, hours, contact and location",
      "Monthly price: $399/mes",
      "Note: Publication activates after final review.",
    ],
    card2Kicker: "Local Food",
    card2Title: "Stand, pop-up, or mobile vendor",
    card2Price: "$199/mes",
    card2Body: "For stands, pop-ups, homemade food, mobile vendors, and weekend operations. Ideal for businesses that sell at temporary locations, events, or local service.",
    card2Cta: "Publish local food",
    card2More: "See more",
    card2MoreTitle: "What's included with Stand / Pop-up / Mobile vendor — $199/mes",
    card2MoreDetails:
      "This plan helps mobile or temporary food vendors show where they'll be, what they sell, how to contact them, and how the community can find them.",
    card2MoreBullets: [
      "What's included: Compact, professional profile with photos or flyer",
      "Who it's for: Stands, pop-ups, homemade food, mobile vendors, markets, events, and weekends",
      "What appears on profile: Sales zone, city, hours/days of presence, contact, links to menu/orders",
      "What you need to complete: Business info, photos, sales zone, hours and contact",
      "Monthly price: $199/mes",
      "Note: Publication activates after final review.",
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
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const t = COPY[lang];

  return (
    <RestaurantesSelectorClient
      t={t}
      lang={lang}
    />
  );
}
