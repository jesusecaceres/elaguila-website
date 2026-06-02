import type { ReactNode } from "react";
import { FiGlobe } from "react-icons/fi";
import {
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiPinterest,
  SiSnapchat,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import type { ServiciosBusinessHubSocialPlatform } from "./serviciosBusinessHubContactTypes";

/** Platform brand colors — isolated here (not global design tokens). */
export type BusinessHubSocialBrandStyle = {
  background: string;
  color: string;
  border?: string;
};

export const BUSINESS_HUB_SOCIAL_BRAND: Record<ServiciosBusinessHubSocialPlatform, BusinessHubSocialBrandStyle> = {
  facebook: { background: "#1877F2", color: "#FFFFFF" },
  instagram: {
    background: "linear-gradient(135deg, #833AB4 0%, #E1306C 45%, #F77737 100%)",
    color: "#FFFFFF",
  },
  tiktok: { background: "#010101", color: "#FFFFFF" },
  x: { background: "#000000", color: "#FFFFFF" },
  youtube: { background: "#FF0000", color: "#FFFFFF" },
  linkedin: { background: "#0A66C2", color: "#FFFFFF" },
  snapchat: {
    background: "#FFFC00",
    color: "#000000",
    border: "1px solid rgba(0, 0, 0, 0.1)",
  },
  pinterest: { background: "#E60023", color: "#FFFFFF" },
  whatsapp: { background: "#25D366", color: "#FFFFFF" },
};

export function businessHubSocialBrandStyle(
  platform: ServiciosBusinessHubSocialPlatform,
): BusinessHubSocialBrandStyle {
  return BUSINESS_HUB_SOCIAL_BRAND[platform];
}

export function BusinessHubSocialBrandIcon({
  platform,
}: {
  platform: ServiciosBusinessHubSocialPlatform;
}) {
  const cls = "h-5 w-5 shrink-0";
  const iconProps = { className: cls, "aria-hidden": true as const };

  let icon: ReactNode;
  switch (platform) {
    case "facebook":
      icon = <SiFacebook {...iconProps} />;
      break;
    case "instagram":
      icon = <SiInstagram {...iconProps} />;
      break;
    case "tiktok":
      icon = <SiTiktok {...iconProps} />;
      break;
    case "x":
      icon = <SiX {...iconProps} />;
      break;
    case "youtube":
      icon = <SiYoutube {...iconProps} />;
      break;
    case "linkedin":
      icon = <SiLinkedin {...iconProps} />;
      break;
    case "snapchat":
      icon = <SiSnapchat {...iconProps} />;
      break;
    case "pinterest":
      icon = <SiPinterest {...iconProps} />;
      break;
    case "whatsapp":
      icon = <SiWhatsapp {...iconProps} />;
      break;
    default:
      icon = <FiGlobe {...iconProps} />;
  }

  return icon;
}
