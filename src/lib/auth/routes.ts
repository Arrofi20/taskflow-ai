export const PROTECTED_ROUTES = [
  "/dashboard",
  "/tugas",
  "/jadwal",
  "/profil",
  "/analisis",
  "/kalender",
  "/referral",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isSafeRedirect(path: string | null): string {
  if (path && isProtectedRoute(path)) {
    return path;
  }

  return "/dashboard";
}
