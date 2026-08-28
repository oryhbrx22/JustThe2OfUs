import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCouple } from "@/lib/couple";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Image as ImageIcon, Mic, BookHeart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const PROMPTS = [
  "What made you smile today?",
  "Describe a memory of us in 3 words.",
  "If today were a song, which one?",
  "What do you want to do together this weekend?",
  "A small thing I love about you…",
  "What made you feel safe today?",
];

function Dashboard() {
  const { user } = useAuth();
  const { couple, partner, me } = useCouple();
  const [stats, setStats] = useState({ messages: 0, photos: 0, notes: 0 });
  const [recentPhoto, setRecentPhoto] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    if (!couple) return;
    (async () => {
      const [m, g, n, recent] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("couple_id", couple.id),
        supabase.from("gallery_items").select("id", { count: "exact", head: true }).eq("couple_id", couple.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("couple_id", couple.id),
        supabase.from("gallery_items").select("url").eq("couple_id", couple.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setStats({ messages: m.count ?? 0, photos: g.count ?? 0, notes: n.count ?? 0 });
      const rawUrl = recent.data?.url ?? null;
      if (rawUrl) {
        const marker = "/gallery/";
        const idx = rawUrl.indexOf(marker);
        const path = idx !== -1 ? rawUrl.slice(idx + marker.length).split("?")[0] : null;
        if (path) {
          const { data: signed } = await supabase.storage.from("gallery").createSignedUrl(path, 60 * 60 * 6);
          setRecentPhoto(signed?.signedUrl ?? rawUrl);
        } else {
          setRecentPhoto(rawUrl);
        }
      } else {
        setRecentPhoto(null);
      }
    })();
  }, [couple]);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const days = couple?.started_at && today
    ? Math.max(1, Math.floor((today.getTime() - new Date(couple.started_at).getTime()) / 86400000))
    : null;

  const prompt = today ? PROMPTS[today.getDate() % PROMPTS.length] : PROMPTS[0];
  const greetingHour = today?.getHours() ?? 12;
  const greeting = greetingHour < 5 ? "Sweet dreams" : greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Hello there" : "Good evening";

  return (
    <div className="px-5 pt-10 pb-6 max-w-xl mx-auto space-y-5">
      <header>
        <p className="font-script text-2xl text-primary">{greeting},</p>
        <h1 className="font-serif text-4xl">{me?.nickname || me?.display_name || "you"}</h1>
        {partner && (
          <p className="text-sm text-muted-foreground mt-1">
            with <span className="text-foreground">{partner.nickname || partner.display_name}</span>
            {days && <> · {days} days together</>}
          </p>
        )}
      </header>

      {recentPhoto ? (
        <div className="paper overflow-hidden p-0">
          <img src={recentPhoto} alt="latest memory" className="w-full h-56 object-cover" />
          <div className="p-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" fill="currentColor" />
            <p className="text-sm">Your latest memory together</p>
          </div>
        </div>
      ) : (
        <div className="paper p-6 text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-2" fill="currentColor" />
          <p className="font-serif text-xl">Your space is empty… and full of room.</p>
          <p className="text-sm text-muted-foreground mt-2">Share a photo, write a note, or send a hello.</p>
        </div>
      )}

      <div className="paper p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4" /> Today's question
        </div>
        <p className="font-serif text-2xl mt-2 leading-snug">{prompt}</p>
        <Link to="/notes" className="text-primary text-sm mt-3 inline-block">Write your answer →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Messages" value={stats.messages} icon={MessageCircle} to="/messages" />
        <Stat label="Photos" value={stats.photos} icon={ImageIcon} to="/gallery" />
        <Stat label="Notes" value={stats.notes} icon={BookHeart} to="/notes" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickLink to="/messages" icon={MessageCircle} title="Send a hello" />
        <QuickLink to="/audio" icon={Mic} title="Voice memory" />
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, to }: { label: string; value: number; icon: any; to: any }) {
  return (
    <Link to={to} className="paper p-4 text-center hover:scale-[1.02] transition">
      <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
      <p className="font-serif text-2xl">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </Link>
  );
}

function QuickLink({ to, icon: Icon, title }: { to: any; icon: any; title: string }) {
  return (
    <Link to={to} className="paper p-4 flex items-center gap-3 hover:bg-muted/50 transition">
      <div className="w-9 h-9 rounded-full bg-accent/60 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}
