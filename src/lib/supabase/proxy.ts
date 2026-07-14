import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isProtectedRoute } from "@/lib/auth/routes";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return { url, anonKey };
}

const PREMIUM_ROUTES = ["/analisis", "/kalender"];

function isPremiumRoute(pathname: string): boolean {
  return PREMIUM_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getIsPremiumFromUser(user: { user_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) return false;
  const meta = user.user_metadata;
  if (meta && typeof meta.is_premium === "boolean") return meta.is_premium;
  if (meta && typeof meta.plan === "string") return meta.plan.toLowerCase() === "premium";
  if (meta && typeof meta.subscription === "string") return meta.subscription.toLowerCase() === "premium";
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isProtectedAppRoute = isProtectedRoute(pathname);

  // Premium route guard
  if (isPremiumRoute(pathname)) {
    const isPremium = getIsPremiumFromUser(user);
    if (!isPremium) {
      const upgradeUrl = request.nextUrl.clone();
      upgradeUrl.pathname = "/profil/subscription";
      return redirectWithCookies(upgradeUrl, supabaseResponse);
    }
  }

  if (!user && isProtectedAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return redirectWithCookies(url, supabaseResponse);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return redirectWithCookies(url, supabaseResponse);
  }

  return supabaseResponse;
}

function redirectWithCookies(url: URL, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    redirectResponse.cookies.set(name, value);
  });

  return redirectResponse;
}
