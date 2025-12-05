"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  const t = {
    es: {
      bienvenidos: "Bienvenidos a",
      comunidad: "Comunidad, Cultura y Orgullo Latino",
      revistaActual: "Revista Digital — Edición Actual",
      pronto: "Muy pronto podrás hojear la primera edición digital."
    },
    en: {
      bienvenidos: "Welcome to",
      comunidad: "Community, Culture & Latino Pride",
      revistaActual: "Digital Magazine — Current Edition",
      pronto: "Soon y
