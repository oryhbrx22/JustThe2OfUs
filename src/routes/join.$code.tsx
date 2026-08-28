import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$code")({
  component: JoinPage,
});

const PENDING_KEY = "solace.pendingInviteCode";

function JoinPage() {
  const { code } = Route.useParams();
  const { user, loading } = useAuth();
  const { couple, refresh } = useCouple();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Opening your invite…");
  const ran = useRef(false);

  useEffect(() => {
    if (loading) return;
    const normalized = decodeURIComponent(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!normalized) {
      toast.error("Invite link is missing a code");
      navigate({ to: "/connect" });
      return;
    }

    if (!user) {
      try { localStorage.setItem(PENDING_KEY, normalized); } catch {}
      setStatus("Sign in to join your space…");
      navigate({ to: "/auth" });
      return;
    }

    if (ran.current) return;
    ran.current = true;

    (async () => {
      // Re-check membership directly (useCouple state may not be hydrated yet)
      const { data: existing } = await supabase
        .from("couple_members")
        .select("couple_id, couples!inner(invite_code)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        const sameSpace = (existing as any)?.couples?.invite_code === normalized;
        toast.message(sameSpace ? "This is already your space" : "You're already in a space");
        await refresh();
        navigate({ to: "/dashboard" });
        return;
      }

      setStatus("Joining your person's space…");
      const { error } = await supabase.rpc("join_couple_by_code", { _code: normalized });
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      if (error) {
        const msg = /not found/i.test(error.message)
          ? `Invite "${normalized}" not found. Ask them to share a fresh link.`
          : error.message || "Could not join space";
        toast.error(msg);
        navigate({ to: "/connect" });
        return;
      }
      await refresh();
      toast.success("You're in.");
      navigate({ to: "/dashboard" });
    })();
  }, [user, loading, couple, code, navigate, refresh]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary animate-pulse" fill="currentColor" />
        <span className="font-serif text-xl">Solace</span>
      </div>
      <p className="text-muted-foreground text-sm">{status}</p>
    </div>
  );
}
