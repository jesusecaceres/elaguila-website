"use client";

import type { IconType } from "react-icons";
import {
  FiAward,
  FiCoffee,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMusic,
  FiSun,
  FiUsers,
  FiWind,
  FiZap,
} from "react-icons/fi";
import { FaDog, FaLeaf, FaParking, FaUtensils } from "react-icons/fa";

/**
 * Maps highlight / trait labels (Spanish-first) to a calm Leonix icon — default when unknown.
 */
export function traitIconForLabel(label: string): IconType {
  const t = label.toLowerCase();

  if (/terraza|exterior|patio|jardín/.test(t)) return FiSun;
  if (/familia|niñ|familiar/.test(t)) return FiUsers;
  if (/románt|pareja|íntim/.test(t)) return FiHeart;
  if (/grupo|grande|celebraci/.test(t)) return FiUsers;
  if (/rápid|servicio r|express/.test(t)) return FiZap;
  if (/vegan|vegetarian|plant/.test(t)) return FaLeaf;
  if (/upscale|elegant|alta coc|fine|premium/.test(t)) return FiAward;
  if (/brunch|desayun/.test(t)) return FiCoffee;
  if (/música|live|dj|banda/.test(t)) return FiMusic;
  if (/mascota|pet/.test(t)) return FaDog;
  if (/parqueo|estaciona|parking/.test(t)) return FaParking;
  if (/marisc|pescad|asador|parrilla|sushi|taco|pizza|bar|cocktail/.test(t)) return FaUtensils;
  if (/vista|mirador|azotea|rooftop/.test(t)) return FiHome;
  if (/aire libre|al aire|exterior/.test(t)) return FiWind;
  if (/céntric|ubicación|zona|barrio/.test(t)) return FiMapPin;

  return FiAward;
}
