import type { Metadata } from "next";
import PageHero from "../components/PageHero";
import RestaurantsBrowser from "./components/RestaurantsBrowser";
import { restaurants } from "../data/restaurants";

export const metadata: Metadata = {
  title: "Restaurants | LEONIX",
  description: "Discover local restaurants with verified profiles and community trust signals.",
  keywords: ["restaurants", "local food", "LEONIX", "Latino community"],
};

export default function RestaurantesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero title="Restaurants" titleEs="Restaurantes" />
      <RestaurantsBrowser restaurants={restaurants} />
    </main>
  );
}
