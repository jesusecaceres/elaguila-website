import type { MetadataRoute } from "next";
import { buildLeonixRobots } from "@/app/lib/seo/leonixDiscoveryContracts";

export {
  buildLeonixRobots,
  LEONIX_ROBOTS_DISALLOW_PATHS,
} from "@/app/lib/seo/leonixDiscoveryContracts";

export default function robots(): MetadataRoute.Robots {
  return buildLeonixRobots();
}
