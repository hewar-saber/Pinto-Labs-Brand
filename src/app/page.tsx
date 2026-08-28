import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import BrandAssets from "@/components/brand-assets";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * The brand index over public/.
 *
 * proxy.ts already refuses this route without a session; the check is repeated
 * here because the Next docs are explicit that a matcher change or a refactor
 * can silently drop Proxy coverage, and a page that hands out the whole
 * library should not depend on a single layer.
 */
export default async function Home() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySession(session)) redirect("/signin");

  return <BrandAssets />;
}
