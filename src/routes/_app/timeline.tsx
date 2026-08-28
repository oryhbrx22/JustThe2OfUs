import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Image as ImageIcon, Mic, BookHeart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/timeline")({ component: Timeline });

type Event = {
  id: string; date: string; type: "first" | "photo" | "note" | "audio" | "message";
  title: string; body?: string; mediaUrl?: string;
};

const ICONS = { first: Sparkles, photo: ImageIcon, note: BookHeart, audio: Mic, message: MessageCircle };

function Timeline() {
  const { couple } = useCouple();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!couple) return;
    (async () => {
      const [photos, notes, audios, msgs] = await Promise.all([
        supabase.from("gallery_items").select("id,url,caption,created_at").eq("couple_id", couple.id).order("created_at"),
        supabase.from("notes").select("id,title,content,created_at,is_private").eq("couple_id", couple.id).eq("is_private", false).order("created_at"),
        supabase.from("audio_items").select("id,title,created_at").eq("couple_id", couple.id).order("created_at"),
        supabase.from("messages").select("id,content,created_at").eq("couple_id", couple.id).order("created_at").limit(1),
      ]);

      const evs: Event[] = [];
      if (couple.started_at) evs.push({ id: "start", date: couple.started_at, type: "first", title: "Your space began" });
      if (photos.data?.[0]) evs.push({ id: "fp", date: photos.data[0].created_at, type: "first", title: "First photo together", mediaUrl: photos.data[0].url });
      if (notes.data?.[0]) evs.push({ id: "fn", date: notes.data[0].created_at, type: "first", title: "First note", body: notes.data[0].content?.slice(0, 80) });
      if (msgs.data?.[0]) evs.push({ id: "fm", date: msgs.data[0].created_at, type: "first", title: "First message", body: msgs.data[0].content ?? "" });
      if (audios.data?.[0]) evs.push({ id: "fa", date: audios.data[0].created_at, type: "first", title: "First voice memory" });

      photos.data?.slice(0, 30).forEach((p) => evs.push({ id: `p-${p.id}`, date: p.created_at, type: "photo", title: p.caption || "A new memory", mediaUrl: p.url }));
      notes.data?.slice(0, 30).forEach((n) => evs.push({ id: `n-${n.id}`, date: n.created_at, type: "note", title: n.title || "A note", body: n.content?.slice(0, 100) }));
      audios.data?.slice(0, 30).forEach((a) => evs.push({ id: `a-${a.id}`, date: a.created_at, type: "audio", title: a.title || "Voice memory" }));

      evs.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setEvents(evs);
    })();
  }, [couple?.id]);

  return (
    <div className="px-5 pt-10 pb-6 max-w-xl mx-auto">
      <header className="mb-6">
        <p className="font-script text-xl text-primary">our story, in moments</p>
        <h1 className="font-serif text-3xl">Timeline</h1>
      </header>

      <ol className="relative border-l border-border ml-3 space-y-6">
        {events.length === 0 && <p className="text-sm text-muted-foreground ml-4">Your story is just beginning.</p>}
        {events.map((e) => {
          const Icon = ICONS[e.type];
          return (
            <li key={e.id} className="ml-6">
              <div className="absolute -left-[14px] mt-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <h3 className="font-serif text-xl mt-0.5">{e.title}</h3>
              {e.body && <p className="text-sm text-muted-foreground mt-1">{e.body}</p>}
              {e.mediaUrl && (
                <img src={e.mediaUrl} alt="" className="mt-3 rounded-2xl max-h-56 object-cover w-full" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
