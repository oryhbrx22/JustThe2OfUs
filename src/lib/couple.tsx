import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export type Couple = {
  id: string;
  invite_code: string;
  started_at: string | null;
  theme: string | null;
  created_by: string;
  bg_url?: string | null;
  bg_blur?: number | null;
  bg_dim?: number | null;
  bg_text_theme?: string | null;
};


export type Profile = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  mood: string | null;
  bg_url?: string | null;
  bg_blur?: number | null;
  bg_dim?: number | null;
  bg_text_theme?: string | null;
};

type CoupleCtx = {
  couple: Couple | null;
  partner: Profile | null;
  me: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CoupleCtx | null>(null);

function useCoupleState(): CoupleCtx {
  const { user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setPartner(null);
      setMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: mem } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: meProf } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setMe(meProf as Profile | null);

    if (!mem) {
      setCouple(null);
      setPartner(null);
      setLoading(false);
      return;
    }
    const { data: c } = await supabase
      .from("couples")
      .select("*")
      .eq("id", mem.couple_id)
      .maybeSingle();
    setCouple(c as Couple | null);

    const { data: members } = await supabase
      .from("couple_members")
      .select("user_id")
      .eq("couple_id", mem.couple_id);
    const partnerId = members?.find((m) => m.user_id !== user.id)?.user_id;
    if (partnerId) {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", partnerId)
        .maybeSingle();
      setPartner(p as Profile | null);
    } else {
      setPartner(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime sync of couple row (shared background, etc.)
  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`couple:${couple.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${couple.id}` },
        (payload) => setCouple(payload.new as Couple),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id]);

  return { couple, partner, me, loading, refresh };
}


export function CoupleProvider({ children }: { children: ReactNode }) {
  const value = useCoupleState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCouple() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCouple must be used inside CoupleProvider");
  return ctx;
}

export function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
