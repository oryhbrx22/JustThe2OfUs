import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sun, Moon, Smile, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_app/messages")({
  component: Messages,
});

type Msg = {
  id: string;
  sender_id: string;
  content: string | null;
  kind: string;
  media_url: string | null;
  reaction: string | null;
  seen_at: string | null;
  created_at: string;
};

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "🥰"];

function Messages() {
  const { user } = useAuth();
  const { couple, partner } = useCouple();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function extractMessagesPath(url: string | null): string | null {
    if (!url) return null;
    const marker = "/messages/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length).split("?")[0];
  }

  async function signMessages(rows: Msg[]): Promise<Msg[]> {
    const paths = rows
      .filter((m) => m.kind === "image" && m.media_url)
      .map((m) => extractMessagesPath(m.media_url))
      .filter((p): p is string => !!p);
    if (paths.length === 0) return rows;
    const { data } = await supabase.storage.from("messages").createSignedUrls(paths, 60 * 60 * 6);
    const map = new Map<string, string>();
    data?.forEach((d) => { if (d.path && d.signedUrl) map.set(d.path, d.signedUrl); });
    return rows.map((m) => {
      if (m.kind !== "image" || !m.media_url) return m;
      const p = extractMessagesPath(m.media_url);
      const signed = p ? map.get(p) : null;
      return signed ? { ...m, media_url: signed } : m;
    });
  }

  useEffect(() => {
    if (!couple || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("couple_id", couple.id)
        .order("created_at", { ascending: true });
      const signed = await signMessages((data as Msg[]) || []);
      if (!cancelled) setMsgs(signed);
      // mark partner messages as seen
      await supabase
        .from("messages")
        .update({ seen_at: new Date().toISOString() })
        .eq("couple_id", couple.id)
        .neq("sender_id", user.id)
        .is("seen_at", null);
    })();

    const channel = supabase
      .channel(`couple-${couple.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `couple_id=eq.${couple.id}` }, async (payload) => {
        const m = payload.new as Msg;
        const [signed] = await signMessages([m]);
        setMsgs((prev) => [...prev, signed]);
        if (m.sender_id !== user.id) {
          supabase.from("messages").update({ seen_at: new Date().toISOString() }).eq("id", m.id);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `couple_id=eq.${couple.id}` }, (payload) => {
        const m = payload.new as Msg;
        setMsgs((prev) => prev.map((x) => (x.id === m.id ? { ...m, media_url: x.media_url } : x)));
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setPartnerTyping(true);
          window.clearTimeout((channel as any)._t);
          (channel as any)._t = window.setTimeout(() => setPartnerTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [couple?.id, user?.id]);


  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, partnerTyping]);

  function emitTyping() {
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: user?.id } });
  }

  async function send(content: string, kind: "text" | "image" | "audio" = "text", media_url: string | null = null) {
    if (!couple || !user) return;
    if (kind === "text" && !content.trim()) return;
    setText("");
    await supabase.from("messages").insert({
      couple_id: couple.id,
      sender_id: user.id,
      content: kind === "text" ? content : null,
      kind,
      media_url,
    });
  }

  async function uploadImage(file: File) {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("messages").upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from("messages").getPublicUrl(path);
    await send("", "image", data.publicUrl);
  }

  async function react(id: string, emoji: string) {
    await supabase.from("messages").update({ reaction: emoji }).eq("id", id);
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="px-5 pt-8 pb-3 flex items-center gap-3 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-serif text-lg">
          {(partner?.nickname || partner?.display_name || "·")[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-serif text-lg leading-tight">{partner?.nickname || partner?.display_name || "Your person"}</p>
          <p className="text-xs text-muted-foreground">{partnerTyping ? "typing…" : "in your space"}</p>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-10">Say hello — your conversation begins here.</p>
        )}
        {msgs.map((m, i) => {
          const mine = m.sender_id === user?.id;
          const showDate = i === 0 || new Date(m.created_at).toDateString() !== new Date(msgs[i - 1].created_at).toDateString();
          return (
            <div key={m.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    {new Date(m.created_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              <Bubble msg={m} mine={mine} onReact={react} isLast={i === msgs.length - 1} />
            </div>
          );
        })}
        {partnerTyping && (
          <div className="flex">
            <div className="bg-secondary px-4 py-3 rounded-3xl rounded-bl-md inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-24 pt-2 sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="flex gap-2 mb-2 px-1">
          <QuickBtn onClick={() => send("Good morning, my love ☀️")} icon={Sun} text="morning" />
          <QuickBtn onClick={() => send("Good night, sweet dreams 🌙")} icon={Moon} text="night" />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(text); }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
          <button type="button" onClick={() => fileRef.current?.click()} className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); emitTyping(); }}
            placeholder="Write to your person…"
            className="flex-1 px-4 py-3 rounded-full bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <button type="submit" className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-soft shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function QuickBtn({ onClick, icon: Icon, text }: { onClick: () => void; icon: any; text: string }) {
  return (
    <button onClick={onClick} type="button" className="text-xs px-3 py-1.5 rounded-full bg-card border border-border flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
      <Icon className="w-3.5 h-3.5" /> {text}
    </button>
  );
}

function Bubble({ msg, mine, onReact, isLast }: { msg: Msg; mine: boolean; onReact: (id: string, e: string) => void; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
      <div className="relative max-w-[78%]">
        <button
          onDoubleClick={() => setOpen((o) => !o)}
          onClick={() => open && setOpen(false)}
          className={`px-4 py-2.5 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap text-left ${
            mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
          }`}
        >
          {msg.kind === "image" && msg.media_url ? (
            <img src={msg.media_url} alt="" className="rounded-2xl max-w-full" />
          ) : (
            msg.content
          )}
        </button>
        {msg.reaction && (
          <span className={`absolute -bottom-2 ${mine ? "left-0" : "right-0"} text-base bg-card border border-border rounded-full px-1.5 py-0.5 shadow-sm`}>
            {msg.reaction}
          </span>
        )}
        {open && (
          <div className={`absolute -top-10 ${mine ? "right-0" : "left-0"} flex gap-1 paper px-2 py-1 z-20`}>
            {REACTIONS.map((e) => (
              <button key={e} onClick={() => { onReact(msg.id, e); setOpen(false); }} className="text-base hover:scale-125 transition">{e}</button>
            ))}
          </div>
        )}
        {mine && isLast && (
          <p className="text-[10px] text-muted-foreground text-right mt-1 mr-1">{msg.seen_at ? "seen" : "sent"}</p>
        )}
      </div>
    </div>
  );
}
