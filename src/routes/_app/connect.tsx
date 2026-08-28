import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCouple, generateInviteCode } from "@/lib/couple";
import { Heart, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/connect")({
  component: Connect,
});

function Connect() {
  const { user, signOut } = useAuth();
  const { couple, refresh } = useCouple();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function createSpace() {
    if (!user) return;
    setBusy(true);
    const inviteCode = generateInviteCode();
    const { data: c, error } = await supabase
      .from("couples")
      .insert({ invite_code: inviteCode, created_by: user.id, started_at: new Date().toISOString().slice(0, 10) })
      .select()
      .single();
    if (error || !c) {
      toast.error(error?.message ?? "Could not create space");
      setBusy(false); return;
    }
    const { error: mErr } = await supabase.from("couple_members").insert({ couple_id: c.id, user_id: user.id });
    if (mErr) { toast.error(mErr.message); setBusy(false); return; }
    await refresh();
    setBusy(false);
    toast.success("Your space is ready");
  }

  function extractCode(raw: string) {
    const trimmed = raw.trim();
    // If a full invite URL is pasted, pull the last path segment
    const fromUrl = trimmed.match(/\/join\/([^/?#\s]+)/i);
    const candidate = fromUrl ? fromUrl[1] : trimmed;
    return decodeURIComponent(candidate).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  async function joinSpace() {
    const normalized = extractCode(code);
    if (!user || !normalized) {
      toast.error("Paste an invite code or link");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("join_couple_by_code", { _code: normalized });
    setBusy(false);
    if (error) {
      const msg = /not found/i.test(error.message)
        ? `Invite "${normalized}" not found. Double-check the code.`
        : error.message || "Could not join space";
      toast.error(msg);
      return;
    }
    await refresh();
    toast.success("You're in.");
    navigate({ to: "/dashboard" });
  }

  const inviteUrl = couple
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${couple.invite_code}`
    : "";

  async function shareInvite() {
    if (!inviteUrl) return;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: "Join our Solace space",
          text: "Open our private space together 💌",
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success("Link copied");
      }
    } catch {}
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen px-6 py-10 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-primary" fill="currentColor" />
        <span className="font-serif text-xl">Solace</span>
      </div>

      <div className="paper p-8 max-w-md w-full">
        {!couple ? (
          <>
            <h1 className="font-serif text-3xl text-center">Connect with your person</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Create a new space, or join with an invite link or code.
            </p>

            <button
              onClick={createSpace}
              disabled={busy}
              className="mt-6 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium shadow-soft disabled:opacity-60"
            >
              Create our space
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <input
                className="w-full px-4 py-3 rounded-2xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm tracking-wider text-center"
                placeholder="Paste invite code or link"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") joinSpace(); }}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                onClick={joinSpace}
                disabled={busy || !code.trim()}
                className="w-full py-3 rounded-2xl border border-border bg-card font-medium disabled:opacity-60"
              >
                {busy ? "Joining…" : "Join their space"}
              </button>
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                Paste the full link or just the 6-character code.
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-center">Send your invite</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Share this link with your person. One tap and they're in.
            </p>

            <div className="mt-6 p-5 rounded-2xl bg-secondary text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Invite link</p>
              <p className="font-mono text-xs mt-2 break-all text-foreground/80">{inviteUrl}</p>
              <p className="mt-3 text-xs text-muted-foreground">or share the code</p>
              <p className="font-serif text-3xl tracking-[0.3em] mt-1">{couple.invite_code}</p>
            </div>

            <button
              onClick={shareInvite}
              className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium shadow-soft inline-flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share invite link
            </button>
            <button
              onClick={copyLink}
              className="mt-2 w-full py-3 rounded-2xl border border-border bg-card font-medium inline-flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="mt-4 w-full py-3 rounded-2xl border border-border bg-card text-sm"
            >
              Enter your space
            </button>
          </>
        )}
        <button onClick={() => signOut()} className="mt-6 w-full text-xs text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </div>
    </div>
  );
}
