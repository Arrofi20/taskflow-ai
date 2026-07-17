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

    const body = (await request.json()) as { referralCode?: string };
    const referralCode = body.referralCode?.trim().toUpperCase();

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: "Kode referral tidak valid." },
        { status: 400 },
      );
    }

    if (!referralCode.startsWith("TF") || referralCode.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Format kode referral tidak valid." },
        { status: 400 },
      );
    }

    // Cari referrer berdasarkan kode referral
    const { data: referrer, error: referrerError } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", referralCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { success: false, error: "Kode referral tidak ditemukan." },
        { status: 404 },
      );
    }

    // Tidak bisa referral diri sendiri
    if (referrer.id === user.id) {
      return NextResponse.json(
        { success: false, error: "Tidak bisa menggunakan kode referral sendiri." },
        { status: 400 },
      );
    }

    // Cek apakah sudah pernah direferal
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrer.id)
      .eq("referred_id", user.id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { success: false, error: "Anda sudah pernah direferal oleh pengguna ini." },
        { status: 400 },
      );
    }

    // Buat record referral
    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      referral_code: referralCode,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    // Cek jumlah referral completed untuk reward
    const { count } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", referrer.id)
      .eq("status", "completed");

    // Reward: 3 referral = 1 bulan premium
    if (count && count >= 3) {
      const now = new Date();
      const premiumUntil = new Date(now);
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);

      await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
        })
        .eq("id", referrer.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan.",
      },
      { status: 500 },
    );
  }
}
