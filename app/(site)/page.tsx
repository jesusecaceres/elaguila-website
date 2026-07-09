import { cookies } from "next/headers";

import { hasPreviewBypassCookie } from "@/app/lib/launchLock/previewBypass";
import { isPublicLaunchLockEnabled } from "@/app/lib/launchLock/publicLaunchLock";
import { requireAdminCookie } from "@/app/lib/supabase/server";

import { RootIntroPageClient } from "./RootIntroPageClient";

export default async function Home() {
  const cookieStore = await cookies();
  const siteUnlocked =
    !isPublicLaunchLockEnabled() ||
    requireAdminCookie(cookieStore) ||
    hasPreviewBypassCookie(cookieStore);

  return <RootIntroPageClient siteUnlocked={siteUnlocked} />;
}
