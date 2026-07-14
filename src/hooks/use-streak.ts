"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function loadAndUpdate() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const lastDate = existing.last_active_date
          ? existing.last_active_date.split("T")[0]
          : null;

        if (lastDate === today) {
          if (mounted) {
            setStreak(existing.current_streak);
            setLoading(false);
          }
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = 1;
        if (lastDate === yesterdayStr) {
          newStreak = (existing.current_streak ?? 0) + 1;
        }

        const longest = Math.max(newStreak, existing.longest_streak ?? 0);

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: longest,
            last_active_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (mounted) {
          setStreak(newStreak);
          setLoading(false);
        }
      } else {
        await supabase.from("user_streaks").insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_active_date: new Date().toISOString(),
        });
        if (mounted) {
          setStreak(1);
          setLoading(false);
        }
      }
    }

    loadAndUpdate();

    return () => {
      mounted = false;
    };
  }, []);

  return { streak, loading };
}
