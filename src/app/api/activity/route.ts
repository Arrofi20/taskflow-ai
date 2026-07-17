import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { logs?: Array<{ hour: number; ts: number }> };
    const logs = body?.logs ?? [];

    if (logs.length === 0) {
      return NextResponse.json({ success: true });
    }

    const insertPayload = logs.map((log) => {
      const d = log.ts ? new Date(log.ts) : new Date();
      d.setHours(log.hour, 0, 0, 0);
      return {
        user_id: user.id,
        active_at: d.toISOString(),
      };
    });

    const { error } = await supabase.from("user_activity_logs").insert(insertPayload);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
