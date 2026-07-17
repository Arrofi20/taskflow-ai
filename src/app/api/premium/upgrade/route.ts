import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_premium: true,
        premium_until: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    // Update metadata auth juga agar middleware proxy langsung mendeteksi
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        is_premium: true,
        plan: "premium",
        subscription: "premium",
      },
    });

    if (metaError) {
      return NextResponse.json(
        { success: false, error: metaError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });

    // Activity logging happens client-side via history/log endpoint
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
