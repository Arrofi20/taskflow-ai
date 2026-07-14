"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function usePremium() {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      let premium = false;
      if (profile?.is_premium != null) {
        premium = profile.is_premium;
      } else {
        const meta = user.user_metadata;
        if (meta && typeof meta.is_premium === "boolean") {
          premium = meta.is_premium;
        } else if (meta && typeof meta.plan === "string") {
          premium = meta.plan.toLowerCase() === "premium";
        } else if (meta && typeof meta.subscription === "string") {
          premium = meta.subscription.toLowerCase() === "premium";
        }
      }

      if (mounted) {
        setIsPremium(premium);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { isPremium, loading };
}
