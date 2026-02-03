"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import { useState } from "react";

// Product structure
interface Product {
  id: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  price: string;
  images: string[]; // can be 1 or 2 images
}

export default function TiendaPage() {
  const searchParams = useSearchParams()!;
  const lang = searchParams.get("lang") || "es";

  // 🟡 SPANISH + ENGLISH COPY
  const t = {
    store: lang === "es" ? "Tienda" : "Store",
    businessCards: lang === "es" ? "Tarjetas de Presentación" : "Business Cards",
    flyers: lang === "es" ? "Volantes" : "Flyers",
    banners: lang === "es" ? "Lonas / Banners" : "Banners",
    contactUs: lang === "es" ? "Contactar para Ordenar" : "Contact to Order",
    emailLine:
      lang === "es"
        ? "Para ordenar, envíanos un correo:"
        : "To place an order, send us an email:",
  };

  // 🟦 PRODUCT LIST
  const products: Product[] = [
    {
      id: "bc-1000-1",
      title: "Tarjetas 1000 • Un Lado",
      title_en: "Business Cards 1000 • One Side",
      description: "Tarjeta premium • Un lado",
      description_en: "Premium business card • One side",
      price: "$95",
      images: ["/tienda/business-cards/business-card-front-chuy.png"],
    },
    {
      id: "bc-1000-2",
      title: "Tarjetas 1000 • Dos Lados",
      title_en: "Business Cards 1000 • Two Sides",
      description: "Tarjeta premium • Dos lados",
      description_en: "Premium business card • Two sided",
      price: "$110",
      images: [
        "/tienda/business-cards/business-card-front-chuy.png",
        "/tienda/business-cards/business-card-back-chuy.png",
      ],
    },
    {
      id: "bc-2500-1",
      title: "Tarjetas 2500 • Un Lado",
      title_en: "Business Cards 2500 • One Side",
      description: "Tarjeta premium • Un lado",
      description_en: "Premium business card • One side",
      price: "$180",
      images: ["/tienda/business-cards/business-card-front-chuy.png"],
    },
    {
      id: "bc-2500-2",
      title: "Tarjetas 2500 • Dos Lados",
      title_en: "Business Cards 2500 • Two Sides",
      description: "Tarjeta premium • Dos lados",
      description_en: "Premium business card • Two sided",
      price: "$195",
      images: [
        "/tienda/business-cards/business-card-front-chuy.png",
        "/tienda/business-cards/business-card-back-chuy.png",
      ],
    },
    {
      id: "bc-5000-1",
      title: "Tarjetas 5000 • Un Lado",
      title_en: "Business Cards 5000 • One Side",
      description: "Tarjeta premium • Un lado",
      description_en: "Premium business card • One side",
      price: "$240",
      images: ["/tienda/business-cards/business-card-front-chuy.png"],
    },
    {
      id: "bc-5000-2",
      title: "Tarjetas 5000 • Dos Lados",
      title_en: "Business Cards 5000 • Two Sides",
      description: "Tarjeta premium • Dos lados",
      description_en: "Premium business card • Two sided",
      price: "$255",
      images: [
        "/tienda/business-cards/business-card-front-chuy.png",
        "/tienda/business-cards/business-card-back-chuy.png",
      ],
    },
    {
      id: "flyer-500-1",
      title: "Volantes 4.25x5.5 • 500 • Un Lado",
      title_en: "Flyers 4.25x5.5 • 500 • One Side",
      description: "Volante premium • Un lado",
      description_en: "Premium flyer • One side",
      price: "$140",
      images: ["/tienda/promo-flyer-es.jpg.png"],
    },
    {
      id: "flyer-500-2",
      title: "Volantes 4.25x5.5 • 500 • Dos Lados",
      title_en: "Flyers 4.25x5.5 • 500 • Two Sides",
      description: "Volante premium • Dos lados",
      description_en: "Premium flyer • Two sided",
      price: "$175",
      images: ["/tienda/promo-flyer-es.jpg.png"],
    },
    {
      id: "banner-2x5",
      title: "Lona 2ft x 5ft • Un Lado",
      title_en: "Banner 2ft x 5ft • One Side",
      description: "Lona premium a todo color",
      description_en: "Premium full-color banner",
      price: "$110",
      images: ["/tienda/promo-banner-es.jpg.png"],
    },
  ];

  // --------------------------
  // Modal viewer
  // --------------------------
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const closeModal = () => setModalProduct(null);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-10">{t.store}</h1>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#111] border border-yellow-700 rounded-xl shadow-xl p-4 hover:scale-[1.02] transition cursor-pointer"
              onClick={() => setModalProduct(product)}
            >
              <Image
                src={product.images[0]}
                alt={product.title}
                width={600}
                height={400}
                className="rounded-lg object-cover w-full h-64"
              />
              <h2 className="mt-4 text-xl font-bold">
                {lang === "es" ? product.title : product.title_en}
              </h2>

              <p className="text-yellow-300 mt-1">
                {lang === "es"
                  ? product.description
                  : product.description_en}
              </p>

              <p className="text-2xl font-bold mt-3">{product.price}</p>
            </div>
          ))}
        </div>

        {/* CONTACT SECTION */}
        <div className="mt-20 text-center">
          <p className="text-lg mb-3">{t.emailLine}</p>
          <a
            href="mailto:info@elaguilamedia.com"
            className="text-2xl text-yellow-400 underline hover:text-yellow-300"
          >
            info@elaguilamedia.com
          </a>
        </div>
      </div>

      {/* MODAL */}
      {modalProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-[#111] p-6 rounded-xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              {lang === "es"
                ? modalProduct.title
                : modalProduct.title_en}
            </h2>

            {/* IMAGES (one or two) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalProduct.images.map((img, index) => (
                <Image
                  key={index}
                  src={img}
                  alt="product image"
                  width={800}
                  height={800}
                  className="rounded-lg w-full object-contain"
                />
              ))}
            </div>

            <p className="text-yellow-300 mt-4">
              {lang === "es"
                ? modalProduct.description
                : modalProduct.description_en}
            </p>

            <p className="text-3xl font-bold mt-4">{modalProduct.price}</p>

            <div className="mt-6 text-center">
              <a
                href="mailto:info@elaguilamedia.com"
                className="bg-yellow-500 text-black px-6 py-3 rounded-full text-xl font-bold hover:bg-yellow-400 transition"
              >
                {t.contactUs}
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
