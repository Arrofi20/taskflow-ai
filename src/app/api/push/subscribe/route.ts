import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { success: false, error: "endpoint, p256dh, and auth are required" },
        { status: 400 },
      );
    }

    // Delete existing subscription for this endpoint first, then insert
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    const { error: insertError } = await supabase
      .from("push_subscriptions")
      .insert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
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
