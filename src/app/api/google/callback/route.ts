import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/kalender?sync=error", request.url),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/kalender?sync=error", request.url),
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      new URL("/kalender?sync=error", request.url),
    );
  }

  // Store tokens in Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  const { error: upsertError } = await supabase
    .from("google_tokens")
    .upsert(
      {
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(
          Date.now() + (tokenData.expires_in ?? 3600) * 1000,
        ).toISOString(),
        calendar_id: "primary",
        sync_enabled: true,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.redirect(
      new URL("/kalender?sync=error", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/kalender?sync=success", request.url),
  );
}
