import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get Google tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json(
        { success: false, error: "Google Calendar belum terhubung. Koneksikan dulu." },
        { status: 400 },
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Google Client ID not configured." },
        { status: 500 },
      );
    }

    // Refresh token if expired
    let accessToken = tokens.access_token;
    if (new Date(tokens.expires_at) < new Date()) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token!,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshRes.json();

      if (!refreshData.access_token) {
        return NextResponse.json(
          { success: false, error: "Gagal refresh token. Hubungkan ulang Google Calendar." },
          { status: 400 },
        );
      }

      accessToken = refreshData.access_token;

      // Update token in DB
      await supabase
        .from("google_tokens")
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(
            Date.now() + (refreshData.expires_in ?? 3600) * 1000,
          ).toISOString(),
        })
        .eq("user_id", user.id);
    }

    const calendarId = tokens.calendar_id ?? "primary";

    // Get user's tasks and schedules
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [tasksRes, schedulesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id,nama_tugas,deadline,status")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .gte("deadline", now.toISOString())
        .lte("deadline", twoWeeksLater.toISOString()),
      supabase
        .from("schedules")
        .select("id,waktu_mulai,waktu_selesai,rekomendasi_ai,tasks!inner(nama_tugas)")
        .eq("user_id", user.id)
        .gte("waktu_mulai", now.toISOString())
        .lte("waktu_mulai", twoWeeksLater.toISOString()),
    ]);

    // Clear old TaskFlow events
    const listRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?q=TaskFlow&singleEvents=true&orderBy=startTime&timeMin=${now.toISOString()}&timeMax=${twoWeeksLater.toISOString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const listData = await listRes.json();
    const existingEvents = listData.items ?? [];

    for (const event of existingEvents) {
      if (event.summary?.includes("TaskFlow")) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      }
    }

    let synced = 0;

    // Sync tasks
    for (const task of tasksRes.data ?? []) {
      const deadline = new Date(task.deadline);
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `📋 ${task.nama_tugas}`,
            description: `Disinkronkan dari TaskFlow AI\nStatus: ${task.status}`,
            start: { dateTime: deadline.toISOString() },
            end: { dateTime: new Date(deadline.getTime() + 60 * 60 * 1000).toISOString() },
          }),
        },
      );
      synced++;
    }

    // Sync schedules
    for (const schedule of schedulesRes.data ?? []) {
      const nested = (schedule as Record<string, unknown>).tasks as Record<string, unknown> | undefined;
      const title = typeof nested?.nama_tugas === "string" ? nested.nama_tugas : "Jadwal";
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `📚 ${title}`,
            description: schedule.rekomendasi_ai
              ? `${schedule.rekomendasi_ai}\nDisinkronkan dari TaskFlow AI`
              : "Disinkronkan dari TaskFlow AI",
            start: { dateTime: new Date(schedule.waktu_mulai).toISOString() },
            end: { dateTime: new Date(schedule.waktu_selesai).toISOString() },
          }),
        },
      );
      synced++;
    }

    // Update last synced
    await supabase
      .from("google_tokens")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Log activity
    try {
      await supabase.from("activity_history").insert({
        user_id: user.id,
        action: "Google Calendar disinkronkan",
        category: "google",
        detail: { synced },
      });
    } catch {
      // Silent fail
    }

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
