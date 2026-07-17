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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      action?: string;
      category?: string;
      detail?: Record<string, unknown>;
    };

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("activity_history").insert({
      user_id: user.id,
      action: body.action,
      category: body.category ?? "other",
      detail: body.detail ?? null,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
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
