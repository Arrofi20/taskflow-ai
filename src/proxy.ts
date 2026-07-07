import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match page routes only — skip static assets, PWA files, and Next internals
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|workbox-|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|json|woff2?)$).*)",
  ],
};
